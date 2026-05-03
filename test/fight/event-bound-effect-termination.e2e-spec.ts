import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Event-bound effect termination', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];
  let buffRemovedIdx: number;

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
    buffRemovedIdx = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('effect_removed step immediately follows buff_removed', () => {
    expect(stepEntries[buffRemovedIdx + 1][1].kind).toBe('effect_removed');
  });

  it('effect_removed step contains the event name', () => {
    expect(stepEntries[buffRemovedIdx + 1][1].eventName).toBe('fire-aura-end');
  });

  it('effect_removed step contains the removed burn effect', () => {
    expect(stepEntries[buffRemovedIdx + 1][1].removed[0].effectType).toBe(
      'burn',
    );
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
              effects: [
                {
                  type: 'BURN',
                  rate: 1.0,
                  level: 1,
                  terminationEvent: 'fire-aura-end',
                },
              ],
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
