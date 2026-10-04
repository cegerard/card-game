import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const ULTIMATE = 'Exsanguination Totale';
const SHOCK = 'Choc Hémorragique';

const ultimate = (rate: number) => ({
  kind: 'CONDITIONAL_ATTACK',
  name: ULTIMATE,
  event: 'turn-start',
  targetingStrategy: 'position-based',
  damages: [{ type: 'PHYSICAL', rate }],
  onLowHealthAfterHit: {
    name: SHOCK,
    threshold: 0.3,
    debuffs: [
      { type: 'defense', rate: 0.4, duration: 4 },
      { type: 'regeneration', rate: 0.8, duration: 4 },
    ],
  },
});

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 0,
  health: 1000,
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
      damages: [{ type: 'PHYSICAL', rate: 0.01 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

describe('Choc Hémorragique', () => {
  let app: INestApplication;

  const stepAfterFirstUltimate = async (rate: number) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: {
          name: 'P1',
          deck: [
            card('scythra', {
              health: 100000,
              skills: { ...card('x').skills, others: [ultimate(rate)] },
            }),
          ],
        },
        player2: {
          name: 'P2',
          deck: [card('prey', { defense: 50, regeneration: 10 })],
        },
      });
    const steps = Object.values(response.body) as any[];
    return steps[steps.findIndex((s) => s.name === ULTIMATE) + 1];
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

  it('debuffs a target left under 30% right after the hit', async () => {
    const step = await stepAfterFirstUltimate(8);

    expect([step.kind, step.name]).toEqual(['debuff', SHOCK]);
  });

  // Debuff values are reported in stat points: 40% of 50 defense, 80% of 10
  // regeneration.
  it('lowers defense and regeneration for 4 turns', async () => {
    const step = await stepAfterFirstUltimate(8);

    expect(
      step.alterations.map((a) => [a.kind, a.value, a.remainingTurns]),
    ).toEqual([
      ['defense', 20, 4],
      ['regeneration', 8, 4],
    ]);
  });

  it('leaves a target above 30% alone', async () => {
    expect((await stepAfterFirstUltimate(1)).name).not.toBe(SHOCK);
  });
});
