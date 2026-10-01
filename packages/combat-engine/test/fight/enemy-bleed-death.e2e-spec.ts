import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const PREDATOR_MAX_HEALTH = 1000;
// 10% of Scythra maximum health.
const PREDATORY_HEAL = 100;

const predatoryAnatomy = {
  kind: 'HEALING',
  name: 'Anatomie Prédatrice',
  rate: 0.1,
  event: 'enemy-bleed-death',
  targetingStrategy: 'self',
  healBasis: 'target-max-health',
};

const bleed = { type: 'BLEED', rate: 1, duration: 3, maxStacks: 8 };

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 150,
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

const scythra = (attackRate: number, effects: object[]) =>
  card('scythra', {
    health: PREDATOR_MAX_HEALTH,
    skills: {
      ...card('scythra').skills,
      simpleAttack: {
        name: 'Lacération du Zéphyr',
        damages: [{ type: 'PHYSICAL', rate: attackRate }],
        targetingStrategy: 'position-based',
        effects,
      },
      others: [predatoryAnatomy],
    },
  });

const payload = (predator: object) => ({
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'P1', deck: [predator] },
  player2: { name: 'P2', deck: [card('prey')] },
});

describe('enemy-bleed-death event', () => {
  let app: INestApplication;

  const predatoryHeals = async (predator: object) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload(predator));
    return (Object.values(response.body) as any[])
      .filter((s) => s.kind === 'healing' && s.name === 'Anatomie Prédatrice')
      .flatMap((s) => s.heal.map((heal) => heal.healed));
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

  it('heals the predator when its prey bleeds out', async () => {
    expect(await predatoryHeals(scythra(0.01, [bleed]))).toEqual([
      PREDATORY_HEAL,
    ]);
  });

  it('does not heal the predator when its attack kills the prey', async () => {
    expect(await predatoryHeals(scythra(2, []))).toEqual([]);
  });
});
