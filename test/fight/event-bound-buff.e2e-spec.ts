import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe("Lion's Inheritance scenario (event-bound buff)", () => {
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

  /**
   * Scenario: Arionis has "Lion's Inheritance" — a turn-end buff skill with
   * activationLimit: 3 and endEvent: 'lions-inheritance-end'.
   * The buff has terminationEvent: 'lions-inheritance-end' and duration: 0
   * (mapped to Infinity — no turn limit).
   *
   * Expected:
   * - Turns 1-3: buff applied each turn (refreshes in-place)
   * - Turn 3: buff_removed step follows the buff step
   * - Turn 4+: skill no longer fires; no more buff steps
   */
  it('produces buff_removed step on 3rd activation', async () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Lions Team',
        deck: [
          {
            id: 'arionis',
            name: 'Arionis',
            attack: 300,
            defense: 50,
            health: 10000,
            speed: 100,
            agility: 10,
            accuracy: 30,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Lion Roar',
                rate: 3.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Claw',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
                  name: "Lion's Inheritance",
                  rate: 0.4,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                  buffType: 'attack',
                  duration: 0,
                  terminationEvent: 'lions-inheritance-end',
                  activationLimit: 3,
                  endEvent: 'lions-inheritance-end',
                },
              ],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
      player2: {
        name: 'Dummy Team',
        deck: [
          {
            id: 'dummy',
            name: 'Dummy',
            attack: 10,
            defense: 0,
            health: 10000,
            speed: 50,
            agility: 0,
            accuracy: 100,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Weak Hit',
                rate: 1.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Poke',
                damages: [{ type: 'PHYSICAL', rate: 0.1 }],
                targetingStrategy: 'position-based',
              },
              others: [],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
    };

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200);

    const steps = Object.values(response.body) as any[];

    const buffRemovedStep = steps.find((s) => s.kind === 'buff_removed');
    expect(buffRemovedStep).toBeDefined();
    expect(buffRemovedStep.eventName).toBe('lions-inheritance-end');
    expect(buffRemovedStep.removed).toHaveLength(1);
    expect(buffRemovedStep.removed[0].kind).toBe('attack');
  });

  it('buff step appears before buff_removed step', async () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Lions Team',
        deck: [
          {
            id: 'arionis',
            name: 'Arionis',
            attack: 300,
            defense: 50,
            health: 10000,
            speed: 100,
            agility: 10,
            accuracy: 30,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Lion Roar',
                rate: 3.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Claw',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
                  name: "Lion's Inheritance",
                  rate: 0.4,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                  buffType: 'attack',
                  duration: 0,
                  terminationEvent: 'lions-inheritance-end',
                  activationLimit: 3,
                  endEvent: 'lions-inheritance-end',
                },
              ],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
      player2: {
        name: 'Dummy Team',
        deck: [
          {
            id: 'dummy',
            name: 'Dummy',
            attack: 10,
            defense: 0,
            health: 10000,
            speed: 50,
            agility: 0,
            accuracy: 100,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Weak Hit',
                rate: 1.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Poke',
                damages: [{ type: 'PHYSICAL', rate: 0.1 }],
                targetingStrategy: 'position-based',
              },
              others: [],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
    };

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const buffRemovedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
    const lastBuffIndex = stepEntries.reduce(
      (last, [, s], i) => (s.kind === 'buff' ? i : last),
      -1,
    );

    expect(buffRemovedIndex).toBeGreaterThan(lastBuffIndex);
  });

  it('no buff steps appear after buff_removed step', async () => {
    const payload = {
      cardSelectorStrategy: 'player-by-player',
      player1: {
        name: 'Lions Team',
        deck: [
          {
            id: 'arionis',
            name: 'Arionis',
            attack: 300,
            defense: 50,
            health: 10000,
            speed: 100,
            agility: 10,
            accuracy: 30,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Lion Roar',
                rate: 3.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Claw',
                damages: [{ type: 'PHYSICAL', rate: 1.0 }],
                targetingStrategy: 'position-based',
              },
              others: [
                {
                  kind: 'BUFF',
                  name: "Lion's Inheritance",
                  rate: 0.4,
                  targetingStrategy: 'self',
                  event: 'turn-end',
                  buffType: 'attack',
                  duration: 0,
                  terminationEvent: 'lions-inheritance-end',
                  activationLimit: 3,
                  endEvent: 'lions-inheritance-end',
                },
              ],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
      player2: {
        name: 'Dummy Team',
        deck: [
          {
            id: 'dummy',
            name: 'Dummy',
            attack: 10,
            defense: 0,
            health: 10000,
            speed: 50,
            agility: 0,
            accuracy: 100,
            criticalChance: 0,
            skills: {
              special: {
                kind: 'ATTACK',
                name: 'Weak Hit',
                rate: 1.0,
                energy: 999,
                targetingStrategy: 'position-based',
              },
              simpleAttack: {
                name: 'Poke',
                damages: [{ type: 'PHYSICAL', rate: 0.1 }],
                targetingStrategy: 'position-based',
              },
              others: [],
            },
            behaviors: { dodge: 'simple-dodge' },
          },
        ],
      },
    };

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200);

    const stepEntries = Object.entries(response.body) as [string, any][];
    const buffRemovedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
    const buffAfterRemoval = stepEntries
      .slice(buffRemovedIndex + 1)
      .some(([, s]) => s.kind === 'buff');

    expect(buffAfterRemoval).toBe(false);
  });
});
