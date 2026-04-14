import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

/**
 * Scenario:
 * - P1: Fodder (card-b, 1 HP) + Avenger (card-a, high HP, dormant healing on self)
 * - P2: Destroyer (card-x, 1 HP, high attack, speed=3 → acts first)
 *
 * Turn order (player-by-player):
 *   1. Destroyer acts first (speed=3): kills Fodder with target-all.
 *      → dormant trigger on Avenger activates (killerCard = Destroyer),
 *        replacement = enemy-death:card-x. No healing fires yet.
 *   2. Avenger acts (speed=2): kills Destroyer with target-all.
 *      → enemy-death:card-x fires on Avenger → dormant trigger fires → healing step.
 *
 * Asserts the full DTO → controller → domain pipeline for the dormant trigger.
 */
describe('Dormant trigger fight simulation', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];
  let destroyerDeathIndex: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildPayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
    destroyerDeathIndex = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'status_change' &&
        s.card?.name === 'Destroyer' &&
        s.status === 'dead',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('destroyer death step is present in fight result', () => {
    expect(destroyerDeathIndex).toBeGreaterThan(-1);
  });

  it('healing step immediately follows destroyer death', () => {
    expect(stepEntries[destroyerDeathIndex + 1][1]).toMatchObject({
      kind: 'healing',
      source: { name: 'Avenger' },
    });
  });

  it('no healing fires before destroyer dies', () => {
    const healingBeforeDeath = stepEntries
      .slice(0, destroyerDeathIndex)
      .some(([, s]) => s.kind === 'healing');
    expect(healingBeforeDeath).toBe(false);
  });
});

function buildPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Avenger Team',
      deck: [
        {
          id: 'card-b',
          name: 'Fodder',
          attack: 1,
          defense: 0,
          health: 1,
          speed: 1,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Weak Strike',
              rate: 0,
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Scratch',
              damages: [{ type: 'PHYSICAL', rate: 0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: 'card-a',
          name: 'Avenger',
          attack: 9999,
          defense: 0,
          health: 9999999,
          speed: 2,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Mega Strike',
              rate: 2,
              energy: 9999,
              targetingStrategy: 'target-all',
            },
            simpleAttack: {
              name: 'Strike',
              damages: [{ type: 'PHYSICAL', rate: 1 }],
              targetingStrategy: 'target-all',
            },
            others: [
              {
                kind: 'HEALING',
                name: "Avenger's Remedy",
                rate: 0.3,
                targetingStrategy: 'self',
                event: 'dormant',
                activationEvent: 'ally-death',
                activationTargetCardId: 'card-b',
                replacementEvent: 'enemy-death',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Enemy Team',
      deck: [
        {
          id: 'card-x',
          name: 'Destroyer',
          attack: 9999,
          defense: 0,
          health: 1,
          speed: 3,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Obliterate',
              rate: 2,
              energy: 9999,
              targetingStrategy: 'target-all',
            },
            simpleAttack: {
              name: 'Ravage',
              damages: [{ type: 'PHYSICAL', rate: 5 }],
              targetingStrategy: 'target-all',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}
