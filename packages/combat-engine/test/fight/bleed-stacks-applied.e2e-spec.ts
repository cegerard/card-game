import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const redWind = {
  event: 'bleed-stacks-applied',
  stackThreshold: 10,
  powerId: 'lames-du-vent-rouge',
};

const redWindStance = {
  ...redWind,
  kind: 'STANCE',
  name: 'Lames du Vent Rouge',
  stanceActivation: { name: 'vent-rouge', duration: 3 },
};

const redWindSpeed = {
  ...redWind,
  kind: 'ALTERATION',
  polarity: 'buff',
  name: 'Lames du Vent Rouge',
  buffType: 'speed',
  rate: 0.2,
  duration: 3,
  targetingStrategy: 'self',
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

const scythra = card('scythra', {
  skills: {
    ...card('scythra').skills,
    simpleAttack: {
      name: 'Lacération du Zéphyr',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects: [
        { type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20, stacks: 2 },
      ],
    },
    others: [redWindStance, redWindSpeed],
  },
});

const payload = {
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [scythra] },
  player2: { name: 'P2', deck: [card('prey')] },
};

describe('bleed-stacks-applied event', () => {
  let app: INestApplication;
  let steps: any[];

  const indexOfStance = () =>
    steps.findIndex((s) => s.kind === 'stance_started');

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload);
    steps = Object.values(response.body);
  });

  afterEach(async () => {
    await app.close();
  });

  it('opens the stance once the tenth stack is laid', () => {
    const attacksBefore = steps
      .slice(0, indexOfStance())
      .filter((s) => s.kind === 'attack' && s.attacker.id === 'scythra');

    expect(attacksBefore).toHaveLength(5);
  });

  it('buffs the speed right after opening the stance', () => {
    expect(steps[indexOfStance() + 1]).toEqual(
      expect.objectContaining({
        kind: 'buff',
        alterations: [expect.objectContaining({ kind: 'speed' })],
      }),
    );
  });

  it('rejects the event without a stack threshold', async () => {
    const { stackThreshold: _omitted, ...withoutThreshold } = redWindStance;
    const invalid = {
      ...payload,
      player1: {
        name: 'P1',
        deck: [
          {
            ...scythra,
            skills: { ...scythra.skills, others: [withoutThreshold] },
          },
        ],
      },
    };

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(invalid);

    expect(response.status).toBe(400);
  });

  it('fires only once in the fight', () => {
    expect(steps.filter((s) => s.kind === 'stance_started')).toHaveLength(1);
  });
});
