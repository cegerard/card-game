import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const HUNTRESS_ID = 'selkhet';
const MAX_STACKS = 3;

const instinct = (budget: Record<string, unknown>) => ({
  kind: 'ALTERATION',
  name: 'Instinct de Chasseresse',
  event: 'turn-end',
  polarity: 'buff',
  buffType: 'speed',
  rate: 0.15,
  duration: 0,
  targetingStrategy: 'self',
  stackId: 'instinct',
  ...budget,
});

const card = (id: string, others = []) => ({
  id,
  name: id,
  attack: 10,
  defense: 0,
  health: 100000,
  speed: 100,
  agility: 0,
  accuracy: 100,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Unused',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Strike',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (budget: Record<string, unknown>) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card(HUNTRESS_ID, [instinct(budget)] as [])] },
  player2: { name: 'P2', deck: [card('prey')] },
});

describe('buff stack cap', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const speedBuffs = async (budget: Record<string, unknown>) => {
    const steps = Object.values((await post(payload(budget))).body) as any[];
    return steps
      .filter((s) => s.kind === 'buff' && s.name === 'Instinct de Chasseresse')
      .flatMap((s) => s.alterations);
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('applies a permanent buff triggered every turn only up to the cap', async () => {
    expect(await speedBuffs({ maxStacks: MAX_STACKS })).toHaveLength(
      MAX_STACKS,
    );
  });

  it('keeps stacking without a budget, so the trigger fires past the cap', async () => {
    const uncapped = await speedBuffs({ stackId: undefined });

    expect(uncapped.length).toBeGreaterThan(MAX_STACKS);
  });

  it('accepts debuffMaxStacks as an alias of maxStacks', async () => {
    expect(await speedBuffs({ debuffMaxStacks: MAX_STACKS })).toHaveLength(
      MAX_STACKS,
    );
  });

  it('returns 400 when maxStacks and its alias disagree', () => {
    return post(
      payload({ maxStacks: MAX_STACKS, debuffMaxStacks: MAX_STACKS + 2 }),
    ).expect(400);
  });

  it('returns 400 when the cap is missing', () => {
    return post(payload({})).expect(400);
  });
});
