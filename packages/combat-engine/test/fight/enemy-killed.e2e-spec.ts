import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const instinct = (extra: object = {}) => ({
  kind: 'ALTERATION',
  name: 'Instinct de Chasseresse',
  polarity: 'buff',
  buffType: 'speed',
  rate: 0.15,
  duration: 0,
  targetingStrategy: 'self',
  event: 'enemy-killed',
  activationCondition: { type: 'health-threshold', threshold: 0.3 },
  ...extra,
});

const card = (id: string, attack: number, others: object[] = []) => ({
  id,
  name: id,
  attack,
  defense: 0,
  health: 1000,
  speed: id === 'selkhet' ? 50 : 1,
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
      name: `${id} attack`,
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others,
  },
  behaviors: { dodge: 'simple-dodge' },
});

// Hits of `blow` on 1000 health: 300 kills a victim left at 10%, 600 one at 40%
const fight = (blow: number, skill: object = instinct()) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('selkhet', blow, [skill])] },
  player2: { name: 'P2', deck: [card('prey', 1), card('second', 1)] },
});

describe('enemy-killed event', () => {
  let app: INestApplication;

  const post = (body: object) =>
    request(app.getHttpServer()).post('/fight').send(body);
  const instinctBuffs = async (body: object) =>
    (Object.values((await post(body)).body) as any[]).filter(
      (s) => s.kind === 'buff' && s.name === 'Instinct de Chasseresse',
    );

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

  it('buffs the killer of a victim it finished under the threshold', async () => {
    const [buff] = await instinctBuffs(fight(300));

    expect(buff.alterations[0]).toEqual(
      expect.objectContaining({
        target: expect.objectContaining({ id: 'selkhet' }),
        kind: 'speed',
      }),
    );
  });

  it('does not fire on a victim killed above the threshold', async () => {
    expect(await instinctBuffs(fight(600))).toEqual([]);
  });

  it('returns 400 with a threshold above 1', () => {
    return post(
      fight(
        300,
        instinct({
          activationCondition: { type: 'health-threshold', threshold: 1.2 },
        }),
      ),
    ).expect(400);
  });

  it('returns 400 with a condition that is not a health threshold', () => {
    return post(
      fight(
        300,
        instinct({
          activationCondition: { type: 'probability', probability: 0.5 },
        }),
      ),
    ).expect(400);
  });

  it('fires on every kill without a threshold', async () => {
    const buffs = await instinctBuffs(
      fight(600, instinct({ activationCondition: undefined })),
    );

    expect(buffs).toHaveLength(2);
  });
});
