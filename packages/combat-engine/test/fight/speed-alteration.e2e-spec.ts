import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const chillingMark = {
  type: 'MARK',
  rate: 0.05,
  damageType: 'WATER',
  maxStacks: 5,
  triggeredDebuff: {
    debuffType: 'speed',
    debuffRate: 0.08,
    duration: 3,
    probability: 1,
  },
};

const speedBuffSkill = {
  kind: 'ALTERATION',
  name: 'Frenzy',
  rate: 0.2,
  duration: 3,
  buffType: 'speed',
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
      damages: [{ type: 'WATER', rate: 2.0 }],
      energy: 1000,
      targetingStrategy: 'target-all',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'WATER', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
    ...overrides,
  },
  behaviors: { dodge: 'simple-dodge' },
});

const payload = (attackerSkills = {}) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [card('attacker', attackerSkills)] },
  player2: { name: 'P2', deck: [card('defender')] },
});

describe('speed alteration', () => {
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

  it('accepts a speed buff skill', async () => {
    const response = await post(payload({ others: [speedBuffSkill] }));

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'buff',
        alterations: [expect.objectContaining({ kind: 'speed', value: 20 })],
      }),
    );
  });

  it('slows the target when a mark triggers a speed debuff', async () => {
    const response = await post(
      payload({
        simpleAttack: {
          name: 'Crocs de Marée',
          damages: [{ type: 'WATER', rate: 1.0 }],
          targetingStrategy: 'position-based',
          effects: [chillingMark],
        },
      }),
    );

    expect(Object.values(response.body)).toContainEqual(
      expect.objectContaining({
        kind: 'debuff',
        alterations: [expect.objectContaining({ kind: 'speed', value: 8 })],
      }),
    );
  });
});
