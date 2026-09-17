import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const AEGIS_ID = 'aegis-01';
const ENEMY_ID = 'enemy-01';
const SKILL_NAME = 'Resilience des marais';

function buildAegis(withReduction: boolean) {
  return {
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
      others: withReduction
        ? [
            {
              kind: 'DAMAGE_REDUCTION',
              name: SKILL_NAME,
              rate: 0.25,
            },
          ]
        : [],
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

function buildPayload(withReduction: boolean) {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: { name: 'Team Aegis', deck: [buildAegis(withReduction)] },
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

async function runFight(withReduction: boolean) {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleFixture.createNestApplication();
  app.useLogger(false);
  await app.init();

  const response = await request(app.getHttpServer())
    .post('/fight')
    .send(buildPayload(withReduction))
    .expect(200);

  await app.close();
  return Object.entries(response.body) as [string, any][];
}

function hitsOnAegis(stepEntries: [string, any][]): any[] {
  return stepEntries.flatMap(([, s]) =>
    (s.damages ?? []).filter(
      (d: any) => d.defender.id === AEGIS_ID && !d.dodge,
    ),
  );
}

describe('DAMAGE_REDUCTION — mitigation at damage time', () => {
  let stepEntries: [string, any][];

  beforeAll(async () => {
    stepEntries = await runFight(true);
  });

  function mitigatedSteps(): [string, any][] {
    return stepEntries.filter(([, s]) => s.kind === 'damage_mitigated');
  }

  it('mitigates every hit taken by Aegis', () => {
    expect(mitigatedSteps()).toHaveLength(hitsOnAegis(stepEntries).length);
  });

  it('names the skill behind the mitigation', () => {
    expect(mitigatedSteps()[0][1].name).toBe(SKILL_NAME);
  });

  it('attributes the mitigation to the card that took the hit', () => {
    expect(mitigatedSteps()[0][1].card.id).toBe(AEGIS_ID);
  });

  it('applies the reduction to the reported damage', () => {
    const damages = hitsOnAegis(stepEntries).map((d) => d.damage);
    expect(new Set(damages)).toEqual(new Set([75]));
  });
});

describe('DAMAGE_REDUCTION — control run without the skill', () => {
  let stepEntries: [string, any][];

  beforeAll(async () => {
    stepEntries = await runFight(false);
  });

  it('takes the full damage', () => {
    const damages = hitsOnAegis(stepEntries).map((d) => d.damage);
    expect(new Set(damages)).toEqual(new Set([100]));
  });

  it('emits no mitigation step', () => {
    const mitigated = stepEntries.filter(
      ([, s]) => s.kind === 'damage_mitigated',
    );
    expect(mitigated).toHaveLength(0);
  });
});
