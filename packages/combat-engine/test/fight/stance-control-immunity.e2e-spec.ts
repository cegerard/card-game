import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ENEMY_ID = 'enemy-01';
const STANCE = 'forteresse-des-ages';

// Ancrage: Aegis refuses control while Forteresse des Ages runs. The enemy
// stuns and poisons on every hit, so the log shows control being refused only
// inside the stance while the poison keeps landing throughout.
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
              stanceActivation: {
                name: STANCE,
                duration: 2,
                immunities: ['control'],
              },
            },
            simpleAttack: {
              name: 'Poing de Limon',
              damages: [{ type: 'PHYSICAL', rate: 0.7 }],
              targetingStrategy: 'position-based',
            },
            others: [],
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
              name: 'Crushing Blow',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
              effects: [
                { type: 'STUNT', rate: 0, level: 1 },
                { type: 'POISON', rate: 0.05, level: 1 },
              ],
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
  };
}

describe('a stance granting control immunity', () => {
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

  const statusOn = (status: string) =>
    indexesOf(
      (s) =>
        s.kind === 'status_change' &&
        s.status === status &&
        s.card.id === AEGIS_ID,
    );
  const stanceStarts = () =>
    indexesOf((s) => s.kind === 'stance_started' && s.name === STANCE);
  const stanceEnds = () =>
    indexesOf((s) => s.kind === 'stance_ended' && s.name === STANCE);

  const insideStance = (i: number) => {
    const lastStart = Math.max(-1, ...stanceStarts().filter((s) => s < i));
    const lastEnd = Math.max(-1, ...stanceEnds().filter((e) => e < i));
    return lastStart > lastEnd;
  };

  it('opens the stance', () => {
    expect(stanceStarts().length).toBeGreaterThan(0);
  });

  it('gets stunted outside the stance', () => {
    expect(statusOn('stunt').some((i) => !insideStance(i))).toBe(true);
  });

  it('never gets stunted inside the stance', () => {
    expect(statusOn('stunt').filter(insideStance)).toEqual([]);
  });

  it('still gets poisoned, which is not control', () => {
    expect(statusOn('poison').length).toBeGreaterThan(0);
  });

  it('gets poisoned inside the stance too', () => {
    expect(statusOn('poison').some(insideStance)).toBe(true);
  });
});
