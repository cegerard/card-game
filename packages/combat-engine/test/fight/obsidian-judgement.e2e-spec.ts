import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const SELKHET_ID = 'selkhet';
const BRUTE_ID = 'brute';
const WEAKLING_ID = 'weakling';
const ULTIMATE = 'Jugement de l’Obsidienne';
const LEGACY = 'Héritage de la Panthère';

const card = (id: string, overrides: Record<string, unknown>) => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 1000,
  speed: 100,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Unused',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: `${id} strike`,
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'target-all',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const selkhet = card(SELKHET_ID, {
  attack: 100,
  regeneration: 400,
  skills: {
    ...card(SELKHET_ID, {}).skills,
    simpleAttack: {
      name: 'Griffe',
      damages: [{ type: 'PHYSICAL', rate: 0.001 }],
      targetingStrategy: 'position-based',
    },
    others: [
      {
        kind: 'CONDITIONAL_ATTACK',
        name: ULTIMATE,
        event: 'ally-health-below',
        targetCardId: SELKHET_ID,
        activationCondition: { type: 'health-threshold', threshold: 0.5 },
        targetingStrategy: 'target-all',
        damages: [
          { type: 'PHYSICAL', rate: 2.0 },
          { type: 'EARTH', rate: 1.2 },
        ],
        hitAlterations: [
          { type: 'agility', rate: 0.5, duration: 3, polarity: 'debuff' },
        ],
        execution: { threshold: 0.25 },
        stanceActivation: { name: LEGACY, duration: 3 },
        activationLimit: 1,
      },
    ],
  },
});

const payload = {
  cardSelectorStrategy: 'player-by-player',
  player1: { name: 'Team Selkhet', deck: [selkhet] },
  player2: {
    name: 'Team Enemy',
    deck: [
      card(BRUTE_ID, { attack: 600, health: 100000 }),
      card(WEAKLING_ID, { health: 400 }),
    ],
  },
};

describe('Jugement de l’Obsidienne — once per fight under a health threshold', () => {
  let app: INestApplication;
  let steps: any[];

  const ultimateSteps = () =>
    steps.filter((s) => s.kind === 'attack' && s.name === ULTIMATE);
  const firstIndex = (predicate: (s: any) => boolean) =>
    steps.findIndex(predicate);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(payload)
      .expect(200);
    steps = Object.values(response.body);
  });

  afterAll(async () => {
    await app.close();
  });

  it('strikes every enemy', () => {
    const [ultimate] = ultimateSteps();

    expect(ultimate.damages.map((d) => d.defender.id)).toEqual([
      BRUTE_ID,
      WEAKLING_ID,
    ]);
  });

  it('lowers the agility of the enemies it left alive', () => {
    const debuff = steps.find(
      (s) => s.kind === 'debuff' && s.name === ULTIMATE,
    );

    expect(debuff.alterations.map((a) => [a.target.id, a.kind])).toEqual([
      [BRUTE_ID, 'agility'],
    ]);
  });

  it('executes the enemy left under 25%', () => {
    expect(steps.find((s) => s.kind === 'executed').card.id).toBe(WEAKLING_ID);
  });

  it('reports the executed enemy dead once', () => {
    const deaths = steps.filter(
      (s) => s.kind === 'status_change' && s.card.id === WEAKLING_ID,
    );

    expect(deaths).toHaveLength(1);
  });

  it('opens the stance of the legacy', () => {
    expect(steps.find((s) => s.kind === 'stance_started').name).toBe(LEGACY);
  });

  it('drops under the threshold again after regenerating', () => {
    const healed = firstIndex((s) => s.kind === 'regenerated');
    const secondDrop = steps
      .slice(healed)
      .find((s) => s.kind === 'attack' && s.damages[0].remainingHealth < 500);

    expect(secondDrop.attacker.id).toBe(BRUTE_ID);
  });

  it('fires only once despite the second drop', () => {
    expect(ultimateSteps()).toHaveLength(1);
  });
});
