import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const dissection = (hits: number) => ({
  kind: 'ATTACK',
  name: 'Dissection Éolienne',
  damages: [{ type: 'PHYSICAL', rate: 0.35 }],
  energy: 0,
  hits,
  targetingStrategy: 'position-based',
  effect: { type: 'BLEED', rate: 0.05, duration: 4, stacks: 2, maxStacks: 8 },
});

const card = (id: string, special: object) => ({
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
    special,
    simpleAttack: {
      name: 'Strike',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (hits: number) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('scythra', dissection(hits))] },
  player2: {
    name: 'P2',
    deck: [card('prey', { ...dissection(1), energy: 1000, effect: undefined })],
  },
});

describe('SpecialAttack with several hits', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);
  const steps = async (hits: number) =>
    Object.values((await post(payload(hits))).body) as any[];

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

  it('reports one damage per hit', async () => {
    const special = (await steps(4)).find((s) => s.kind === 'special_attack');

    expect(special.damages.map((d) => d.damage)).toEqual([35, 35, 35, 35]);
  });

  it('applies the effect on every landed hit', async () => {
    const stacks = (await steps(4))
      .filter((s) => s.kind === 'status_change' && s.status === 'bleed')
      .slice(0, 4)
      .map((s) => s.stacks);

    expect(stacks).toEqual([2, 4, 6, 8]);
  });

  it('returns 400 with less than one hit', () => {
    return post(payload(0)).expect(400);
  });
});
