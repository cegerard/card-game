import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ENEMY_ID = 'enemy-01';
const POWER_ID = 'forteresse-des-ages';

function buildPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Aegis',
      deck: [
        {
          id: AEGIS_ID,
          name: 'Aegis',
          attack: 100,
          defense: 0,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Forteresse des Ages',
              damages: [{ type: 'EARTH', rate: 1 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Poing de Limon',
              damages: [{ type: 'PHYSICAL', rate: 0.7 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'CONDITIONAL_ATTACK',
                name: 'Contre-attaque defensive',
                event: 'damage-taken',
                targetCardId: AEGIS_ID,
                damages: [{ type: 'EARTH', rate: 0.5 }],
                targetingStrategy: 'last-attacker-of-ally',
                powerId: POWER_ID,
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Team Enemy',
      deck: [
        {
          id: ENEMY_ID,
          name: 'Enemy',
          attack: 50,
          defense: 0,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Big Slash',
              damages: [{ type: 'PHYSICAL', rate: 3 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Smash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
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

describe('damage-taken — counter attack on every landed hit', () => {
  let app: INestApplication;
  let stepEntries: [string, any][];

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  function counterSteps(): [string, any][] {
    return stepEntries.filter(
      ([, s]) => s.kind === 'attack' && s.powerId === POWER_ID,
    );
  }

  it('counters on more than one hit', () => {
    expect(counterSteps().length).toBeGreaterThan(1);
  });

  it('counters as many times as Aegis is hit', () => {
    const hitsOnAegis = stepEntries.filter(([, s]) =>
      s.damages?.some((d: any) => d.defender.id === AEGIS_ID && !d.dodge),
    );
    expect(counterSteps()).toHaveLength(hitsOnAegis.length);
  });

  it('counters the card that hit Aegis', () => {
    const defenders = counterSteps().map(
      ([, s]) => s.damages?.[0]?.defender?.id,
    );
    expect(new Set(defenders)).toEqual(new Set([ENEMY_ID]));
  });

  it('attributes the counter attack to Aegis', () => {
    expect(counterSteps()[0][1].attacker.id).toBe(AEGIS_ID);
  });
});
