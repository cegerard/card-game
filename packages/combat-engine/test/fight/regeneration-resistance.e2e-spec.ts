import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const poisonEffect = {
  type: 'POISON',
  rate: 0.1,
  level: 3,
};

const regenerationBuffSkill = {
  kind: 'ALTERATION',
  name: 'Endurance séculaire',
  rate: 0.15,
  duration: 1,
  buffType: 'regeneration',
  polarity: 'buff',
  event: 'turn-end',
  targetingStrategy: 'self',
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 100000,
  speed: 100,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects: [poisonEffect],
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const payload = (defenderOverrides = {}) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('attacker')] },
  player2: { name: 'P2', deck: [card('defender', defenderOverrides)] },
});

describe('regeneration and resistance', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

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

  it('heals the regeneration stat at each turn end', async () => {
    const response = await post(payload({ regeneration: 55 }));

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'regenerated',
        card: expect.objectContaining({ id: 'defender' }),
        healed: 55,
      }),
    );
  });

  it('emits no regenerated step without the stat', async () => {
    const response = await post(payload());

    expect(Object.values(response.body)).not.toContainEqual(
      expect.objectContaining({ kind: 'regenerated' }),
    );
  });

  it('raises the regeneration through a buff', async () => {
    const response = await post(
      payload({
        regeneration: 40,
        skills: {
          ...card('defender').skills,
          others: [regenerationBuffSkill],
        },
      }),
    );

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'buff',
        alterations: [expect.objectContaining({ kind: 'regeneration' })],
      }),
    );
  });

  it('lets a full resistance refuse every incoming status', async () => {
    const response = await post(payload({ resistance: 200 }));

    expect(Object.values(response.body)).not.toContainEqual(
      expect.objectContaining({
        kind: 'status_change',
        status: 'poison',
        card: expect.objectContaining({ id: 'defender' }),
      }),
    );
  });

  it('lets a card without resistance take the status', async () => {
    const response = await post(payload());

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'status_change',
        status: 'poison',
        card: expect.objectContaining({ id: 'defender' }),
      }),
    );
  });
});
