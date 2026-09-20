import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ENEMY_ID = 'enemy-01';
const STANCE = 'forteresse-des-ages';
const COUNTER = 'Contre-attaque defensive';

// The counter attack must only answer hits taken while Forteresse des Ages
// runs. The special needs four actions of energy and the stance lasts two
// turns, so the fight alternates between windows where it applies and windows
// where it does not.
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
          health: 50000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Forteresse des Ages',
              damages: [{ type: 'EARTH', rate: 0 }],
              energy: 40,
              targetingStrategy: 'position-based',
              stanceActivation: { name: STANCE, duration: 2 },
            },
            simpleAttack: {
              name: 'Poing de Limon',
              damages: [{ type: 'PHYSICAL', rate: 0.7 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'CONDITIONAL_ATTACK',
                name: COUNTER,
                event: 'damage-taken',
                targetCardId: AEGIS_ID,
                requiresStance: STANCE,
                damages: [{ type: 'EARTH', rate: 0.5 }],
                targetingStrategy: 'last-attacker-of-ally',
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
          health: 50000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Unused',
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

describe('a skill scoped to a stance', () => {
  let app: any;
  let steps: any[];

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

    steps = Object.values(response.body);
  });

  afterAll(async () => {
    await app.close();
  });

  const indexesOf = (predicate: (s: any) => boolean) =>
    steps.reduce(
      (acc: number[], s, i) => (predicate(s) ? [...acc, i] : acc),
      [],
    );

  const counterIndexes = () =>
    indexesOf((s) => s.kind === 'attack' && s.name === COUNTER);
  const stanceStarts = () =>
    indexesOf((s) => s.kind === 'stance_started' && s.name === STANCE);
  const stanceEnds = () =>
    indexesOf((s) => s.kind === 'stance_ended' && s.name === STANCE);
  const hitsOnAegis = () =>
    steps.flatMap((s) =>
      (s.damages ?? []).filter(
        (d: any) => d.defender.id === AEGIS_ID && !d.dodge,
      ),
    );

  it('opens the stance when the special fires', () => {
    expect(stanceStarts().length).toBeGreaterThan(0);
  });

  it('closes the stance when its duration runs out', () => {
    expect(stanceEnds().length).toBeGreaterThan(0);
  });

  it('counters while the stance runs', () => {
    expect(counterIndexes().length).toBeGreaterThan(0);
  });

  it('never counters before the stance is ever opened', () => {
    expect(counterIndexes()[0]).toBeGreaterThan(stanceStarts()[0]);
  });

  it('takes hits it does not answer, outside the stance', () => {
    expect(counterIndexes().length).toBeLessThan(hitsOnAegis().length);
  });

  it('never counters between a stance ending and the next one opening', () => {
    const outside = counterIndexes().filter((i) => {
      const lastEnd = Math.max(-1, ...stanceEnds().filter((e) => e < i));
      const lastStart = Math.max(-1, ...stanceStarts().filter((s) => s < i));
      return lastEnd > lastStart;
    });

    expect(outside).toEqual([]);
  });
});
