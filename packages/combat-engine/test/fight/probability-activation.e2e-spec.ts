import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ENEMY_ID = 'enemy-01';
const SKILL_NAME = 'Enlisement';

// Resilience des marais: a share of the hits Aegis takes slows the attacker.
// The probability is the activation chance of the skill itself, so the two
// certain values make the wiring observable without a flaky assertion.
function buildPayload(probability: number) {
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
                kind: 'ALTERATION',
                name: SKILL_NAME,
                event: 'damage-taken',
                targetCardId: AEGIS_ID,
                polarity: 'debuff',
                buffType: 'speed',
                rate: 0.1,
                duration: 3,
                targetingStrategy: 'last-attacker-of-ally',
                activationCondition: { type: 'probability', probability },
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

async function runFight(probability: number) {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  app.useLogger(false);
  await app.init();

  const response = await request(app.getHttpServer())
    .post('/fight')
    .send(buildPayload(probability))
    .expect(200);

  await app.close();
  return Object.entries(response.body) as [string, any][];
}

function debuffSteps(stepEntries: [string, any][]): any[] {
  return stepEntries
    .filter(([, s]) => s.kind === 'debuff' && s.name === SKILL_NAME)
    .map(([, s]) => s);
}

function hitsOnAegis(stepEntries: [string, any][]): any[] {
  return stepEntries.flatMap(([, s]) =>
    (s.damages ?? []).filter(
      (d: any) => d.defender.id === AEGIS_ID && !d.dodge,
    ),
  );
}

describe('probability activation condition — certain activation', () => {
  let stepEntries: [string, any][];

  beforeAll(async () => {
    stepEntries = await runFight(1);
  });

  it('activates on every hit taken', () => {
    expect(debuffSteps(stepEntries)).toHaveLength(
      hitsOnAegis(stepEntries).length,
    );
  });

  it('slows the card that hit Aegis', () => {
    expect(debuffSteps(stepEntries)[0].alterations[0].target.id).toBe(ENEMY_ID);
  });

  it('applies the debuff on the speed stat', () => {
    expect(debuffSteps(stepEntries)[0].alterations[0].kind).toBe('speed');
  });

  it('credits the debuff to Aegis', () => {
    expect(debuffSteps(stepEntries)[0].source.id).toBe(AEGIS_ID);
  });
});

describe('probability activation condition — certain failure', () => {
  let stepEntries: [string, any][];

  beforeAll(async () => {
    stepEntries = await runFight(0);
  });

  it('never activates', () => {
    expect(debuffSteps(stepEntries)).toHaveLength(0);
  });

  it('still lets Aegis take hits', () => {
    expect(hitsOnAegis(stepEntries).length).toBeGreaterThan(0);
  });
});
