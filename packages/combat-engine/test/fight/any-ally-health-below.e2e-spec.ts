import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const THRESHOLD = 0.2;

const guardianSkill = {
  kind: 'HEALING',
  name: 'Gardien Éternel',
  rate: 1.0,
  event: 'any-ally-health-below',
  targetingStrategy: 'most-wounded-ally',
  activationCondition: {
    type: 'health-threshold',
    operator: 'below',
    threshold: THRESHOLD,
  },
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 1000,
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
      energy: 100000,
      targetingStrategy: 'target-all',
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

const guardian = card('guardian', {
  skills: { ...card('guardian').skills, others: [guardianSkill] },
});

// Each opponent faces the P1 card at its own position. Only the one facing the
// beaten card hits hard enough to cross the threshold, so each payload picks
// who falls — something the guardian cannot know when its deck is built.
const payload = (beatenPosition: number) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [guardian, card('ally-a'), card('ally-b')] },
  player2: {
    name: 'P2',
    deck: [0, 1, 2].map((position) =>
      card(`enemy-${position}`, {
        attack: position === beatenPosition ? 850 : 0,
      }),
    ),
  },
});

describe('any-ally-health-below with most-wounded-ally targeting', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

  const healingTargets = (body) =>
    Object.values(body)
      .filter((step: any) => step.kind === 'healing')
      .flatMap((step: any) => step.heal)
      .map((heal: any) => heal.target.id);

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

  it('heals the ally that fell below the threshold', async () => {
    const response = await post(payload(1));

    expect(healingTargets(response.body)[0]).toBe('ally-a');
  });

  it('heals the other ally when that one falls instead', async () => {
    const response = await post(payload(2));

    expect(healingTargets(response.body)[0]).toBe('ally-b');
  });

  it('emits no healing while every ally is above the threshold', async () => {
    const response = await post(payload(-1));

    expect(healingTargets(response.body)).toEqual([]);
  });

  it('leaves the guardian to fend for itself', async () => {
    const response = await post(payload(0));

    expect(healingTargets(response.body)).toEqual([]);
  });
});

describe('any-ally-health-below validation', () => {
  let app: INestApplication;

  const postSkill = (skill) =>
    request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: {
          name: 'P1',
          deck: [
            card('guardian', {
              skills: { ...card('guardian').skills, others: [skill] },
            }),
          ],
        },
        player2: { name: 'P2', deck: [card('enemy')] },
      });

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

  it('refuses the trigger without a threshold', async () => {
    const { activationCondition: _, ...noThreshold } = guardianSkill;

    await postSkill(noThreshold).expect(400);
  });

  it('refuses most-wounded-ally targeting without a threshold', async () => {
    const { activationCondition: _, ...noThreshold } = guardianSkill;

    await postSkill({ ...noThreshold, event: 'turn-end' }).expect(400);
  });

  it('needs no targetCardId', async () => {
    await postSkill(guardianSkill).expect(200);
  });
});
