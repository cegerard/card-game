import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const redWindStance = {
  kind: 'STANCE',
  name: 'Lames du Vent Rouge',
  event: 'bleed-stacks-applied',
  stackThreshold: 2,
  stanceActivation: { name: 'vent-rouge', duration: 3 },
};

const redWindBleed = {
  kind: 'BLEED_EMPOWERMENT',
  name: 'Lames du Vent Rouge',
  requiresStance: 'vent-rouge',
  extraStacks: 1,
  rate: 0.08,
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const scythra = (others: object[]) =>
  card('scythra', {
    skills: {
      ...card('scythra').skills,
      simpleAttack: {
        name: 'Lacération du Zéphyr',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
        effects: [{ type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20 }],
      },
      others,
    },
  });

describe('BLEED_EMPOWERMENT skill', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const stacksAfterEachBleed = async (others: object[]) => {
    const response = await post({
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'P1', deck: [scythra(others)] },
      player2: { name: 'P2', deck: [card('prey')] },
    });
    return (Object.values(response.body) as any[])
      .filter((s) => s.kind === 'status_change' && s.status === 'bleed')
      .slice(0, 3)
      .map((s) => s.stacks);
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

  it('lays an extra stack once the stance is open', async () => {
    expect(await stacksAfterEachBleed([redWindStance, redWindBleed])).toEqual([
      1, 2, 4,
    ]);
  });

  it('lays nothing more without the stance', async () => {
    expect(await stacksAfterEachBleed([redWindBleed])).toEqual([1, 2, 3]);
  });

  it('rejects the skill without its stance', async () => {
    const { requiresStance: _omitted, ...withoutStance } = redWindBleed;

    const response = await post({
      cardSelectorStrategy: 'player-by-player',
      player1: { name: 'P1', deck: [scythra([withoutStance])] },
      player2: { name: 'P2', deck: [card('prey')] },
    });

    expect(response.status).toBe(400);
  });
});
