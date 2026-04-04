import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Event-bound effect termination', () => {
  let app: INestApplication;
  let steps: any[];

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

    steps = Object.values(response.body) as any[];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces an effect_removed step', () => {
    const effectRemovedStep = steps.find((s) => s.kind === 'effect_removed');

    expect(effectRemovedStep).toBeDefined();
  });

  it('effect_removed step contains the event name', () => {
    const effectRemovedStep = steps.find((s) => s.kind === 'effect_removed');

    expect(effectRemovedStep?.eventName).toBe('fire-aura-end');
  });

  it('effect_removed step contains the removed burn effect', () => {
    const effectRemovedStep = steps.find((s) => s.kind === 'effect_removed');

    expect(effectRemovedStep?.removed[0].effectType).toBe('burn');
  });
});

function buildPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Fire Team',
      deck: [
        {
          id: 'fire-mage',
          name: 'Fire Mage',
          attack: 500,
          defense: 50,
          health: 10000,
          speed: 200,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Fireball',
              rate: 1.0,
              energy: 999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Fire Strike',
              damages: [{ type: 'FIRE', rate: 1.0 }],
              targetingStrategy: 'position-based',
              effect: {
                type: 'BURN',
                rate: 1.0,
                level: 1,
                terminationEvent: 'fire-aura-end',
              },
            },
            others: [
              {
                kind: 'BUFF',
                name: 'Fire Aura',
                rate: 0.1,
                targetingStrategy: 'self',
                event: 'turn-end',
                buffType: 'attack',
                duration: 0,
                terminationEvent: 'fire-aura-end',
                activationLimit: 1,
                endEvent: 'fire-aura-end',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Target Team',
      deck: [
        {
          id: 'target',
          name: 'Target',
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
              rate: 0.01,
              energy: 999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Poke',
              damages: [{ type: 'PHYSICAL', rate: 0.01 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}
