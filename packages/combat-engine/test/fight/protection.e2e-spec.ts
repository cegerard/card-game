import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const THRESHOLD = 0.2;

// Gardien Éternel: steps in front of whichever ally drops under 20% health,
// once per fight, for two of the guardian's turns.
const guardianSkill = {
  kind: 'PROTECTION',
  name: 'Gardien Éternel',
  duration: 2,
  event: 'any-ally-health-below',
  targetingStrategy: 'most-wounded-ally',
  activationLimit: 1,
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
  health: 100000,
  skills: { ...card('guardian').skills, others: [guardianSkill] },
});

// enemy-1 faces ally-a and beats it under the threshold; enemy-0 facing the
// guardian deals nothing, so only the protected ally can pull the trigger.
const payload = (withGuardianSkill = true) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [
      withGuardianSkill ? guardian : card('guardian', { health: 100000 }),
      card('ally-a'),
    ],
  },
  player2: {
    name: 'P2',
    deck: [card('enemy-0', { attack: 0 }), card('enemy-1', { attack: 850 })],
  },
});

describe('protection and attack interception', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

  const stepsOf = (body, kind: string) =>
    Object.values(body).filter((s: any) => s.kind === kind);

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

  it('opens the protection on the ally that fell', async () => {
    const response = await post(payload());

    expect(stepsOf(response.body, 'protection_started')[0]).toMatchObject({
      name: 'Gardien Éternel',
      card: expect.objectContaining({ id: 'guardian' }),
      protectedCard: expect.objectContaining({ id: 'ally-a' }),
      remainingTurns: 2,
    });
  });

  it('opens it only once per fight', async () => {
    const response = await post(payload());

    expect(stepsOf(response.body, 'protection_started')).toHaveLength(1);
  });

  it('reports the guardian taking a hit aimed at the ally', async () => {
    const response = await post(payload());

    expect(stepsOf(response.body, 'attack_intercepted')[0]).toMatchObject({
      card: expect.objectContaining({ id: 'guardian' }),
      protectedCard: expect.objectContaining({ id: 'ally-a' }),
    });
  });

  it('spends the intercepted damage on the guardian', async () => {
    const response = await post(payload());
    const index = Object.values(response.body).findIndex(
      (s: any) => s.kind === 'attack_intercepted',
    );
    const hit: any = Object.values(response.body)[index - 1];

    expect(hit.damages[0].defender.id).toBe('guardian');
  });

  it('closes the protection when its duration runs out', async () => {
    const response = await post(payload());

    expect(stepsOf(response.body, 'protection_ended')[0]).toMatchObject({
      card: expect.objectContaining({ id: 'guardian' }),
      protectedCard: expect.objectContaining({ id: 'ally-a' }),
    });
  });

  it('intercepts nothing without the skill', async () => {
    const response = await post(payload(false));

    expect(stepsOf(response.body, 'attack_intercepted')).toHaveLength(0);
  });

  it('refuses a protection skill with no duration', async () => {
    const { duration: _, ...noDuration } = guardianSkill;

    await post({
      ...payload(),
      player1: {
        name: 'P1',
        deck: [
          card('guardian', {
            skills: { ...card('guardian').skills, others: [noDuration] },
          }),
        ],
      },
    }).expect(400);
  });
});
