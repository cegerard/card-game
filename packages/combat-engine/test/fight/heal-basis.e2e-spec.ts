import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const ALLY_MAX_HEALTH = 1000;
const RATE = 0.1;
// 10% of the ally maximum health, whatever the healer's attack is.
const SHARE_OF_MAX_HEALTH = 100;

const healSkill = (overrides = {}) => ({
  kind: 'HEALING',
  name: 'Régénération partagée',
  rate: RATE,
  event: 'turn-end',
  targetingStrategy: 'all-owner-cards',
  ...overrides,
});

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: ALLY_MAX_HEALTH,
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

const payload = (healerAttack: number, skill) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [
      card('healer', {
        attack: healerAttack,
        skills: { ...card('healer').skills, others: [skill] },
      }),
    ],
  },
  player2: { name: 'P2', deck: [card('enemy', { attack: 300 })] },
});

describe('healing basis', () => {
  let app: INestApplication;

  const post = (body) => request(app.getHttpServer()).post('/fight').send(body);

  const firstHealAmount = (body) =>
    Object.values(body)
      .filter((step: any) => step.kind === 'healing')
      .flatMap((step: any) => step.heal)[0]?.healed;

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

  it('heals a share of the target maximum health when asked', async () => {
    const response = await post(
      payload(100, healSkill({ healBasis: 'target-max-health' })),
    );

    expect(firstHealAmount(response.body)).toBe(SHARE_OF_MAX_HEALTH);
  });

  it('gives the same heal from a weaker healer', async () => {
    const response = await post(
      payload(10, healSkill({ healBasis: 'target-max-health' })),
    );

    expect(firstHealAmount(response.body)).toBe(SHARE_OF_MAX_HEALTH);
  });

  it('still scales with the healer attack by default', async () => {
    const response = await post(payload(100, healSkill()));

    expect(firstHealAmount(response.body)).toBe(10);
  });

  it('refuses an unknown basis', async () => {
    await post(payload(100, healSkill({ healBasis: 'vibes' }))).expect(400);
  });
});
