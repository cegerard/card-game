import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const THRESHOLD = 0.2;

// The threshold belongs to the trigger here: it says *an ally* fell low.
// It must not double as a health gate on the caster, who is in perfect shape.
const selfBuff = {
  kind: 'ALTERATION',
  name: 'Carapace ancestrale',
  event: 'any-ally-health-below',
  polarity: 'buff',
  buffType: 'defense',
  rate: 0.5,
  duration: 2,
  targetingStrategy: 'self',
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
  defense: 100,
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

// enemy-0 cannot scratch the guardian, enemy-1 floors the ally.
const payload = () => ({
  cardSelectorStrategy: 'player-by-player',
  player1: {
    name: 'P1',
    deck: [
      card('guardian', {
        health: 100000,
        skills: { ...card('guardian').skills, others: [selfBuff] },
      }),
      card('ally'),
    ],
  },
  player2: {
    name: 'P2',
    deck: [card('enemy-0', { attack: 0 }), card('enemy-1', { attack: 950 })],
  },
});

describe('an alteration triggered by any-ally-health-below', () => {
  let app: INestApplication;

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

  it('fires on a caster in perfect health', async () => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload());

    expect(
      Object.values(response.body).filter(
        (s: any) => s.kind === 'buff' && s.name === 'Carapace ancestrale',
      ),
    ).toHaveLength(1);
  });
});
