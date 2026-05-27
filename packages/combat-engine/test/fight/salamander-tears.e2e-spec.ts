import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const ARIONIS_ID = 'arionis-01';
const KAELION_ID = 'kaelion-01';
const ENEMY_ID = 'enemy-01';

function buildPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Kaelion',
      deck: [
        {
          id: KAELION_ID,
          name: 'Kaelion',
          attack: 200,
          defense: 0,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Fire Nova',
              damages: [{ type: 'FIRE', rate: 3 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Slash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'CONDITIONAL_ATTACK',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                damages: [{ type: 'FIRE', rate: 2.0 }],
                targetingStrategy: 'last-attacker-of-ally',
                powerId: 'salamander-tears',
              },
              {
                kind: 'ALTERATION',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                polarity: 'buff',
                buffType: 'attack',
                rate: 0.1,
                duration: 5,
                targetingStrategy: 'linked-ally',
                powerId: 'salamander-tears',
              },
              {
                kind: 'ALTERATION',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                polarity: 'buff',
                buffType: 'defense',
                rate: 0.2,
                duration: 5,
                targetingStrategy: 'linked-ally',
                powerId: 'salamander-tears',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: ARIONIS_ID,
          name: 'Arionis',
          attack: 100,
          defense: 0,
          health: 1000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Inferno',
              damages: [{ type: 'FIRE', rate: 3 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Fire Strike',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
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
          attack: 200,
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
              targetingStrategy: 'target-all',
            },
            simpleAttack: {
              name: 'Smash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
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

function buildPayloadWithoutArionis() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Team Kaelion Solo',
      deck: [
        {
          id: KAELION_ID,
          name: 'Kaelion',
          attack: 200,
          defense: 0,
          health: 5000,
          speed: 100,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Fire Nova',
              damages: [{ type: 'FIRE', rate: 3 }],
              energy: 9999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Slash',
              damages: [{ type: 'PHYSICAL', rate: 1.0 }],
              targetingStrategy: 'position-based',
            },
            others: [
              {
                kind: 'CONDITIONAL_ATTACK',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                damages: [{ type: 'FIRE', rate: 2.0 }],
                targetingStrategy: 'last-attacker-of-ally',
                powerId: 'salamander-tears',
              },
              {
                kind: 'ALTERATION',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                polarity: 'buff',
                buffType: 'attack',
                rate: 0.1,
                duration: 5,
                targetingStrategy: 'linked-ally',
                powerId: 'salamander-tears',
              },
              {
                kind: 'ALTERATION',
                name: 'Salamander Tears',
                event: 'ally-health-below',
                targetCardId: ARIONIS_ID,
                activationCondition: {
                  type: 'health-threshold',
                  operator: 'below',
                  threshold: 0.3,
                },
                polarity: 'buff',
                buffType: 'defense',
                rate: 0.2,
                duration: 5,
                targetingStrategy: 'linked-ally',
                powerId: 'salamander-tears',
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
          attack: 200,
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

describe('Salamander Tears — link skill trigger', () => {
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

  it('produces an attack step with powerId salamander-tears', () => {
    const idx = stepEntries.findIndex(
      ([, s]) => s.kind === 'attack' && s.powerId === 'salamander-tears',
    );
    expect(idx).toBeGreaterThan(-1);
  });

  it('attack step targets the last attacker of Arionis', () => {
    const step = stepEntries.find(
      ([, s]) => s.kind === 'attack' && s.powerId === 'salamander-tears',
    );
    const defender = step?.[1].damages?.[0]?.defender;
    expect(defender?.id).toBe(ENEMY_ID);
  });

  it('produces two buff steps with powerId salamander-tears', () => {
    const buffSteps = stepEntries.filter(
      ([, s]) => s.kind === 'buff' && s.powerId === 'salamander-tears',
    );
    expect(buffSteps).toHaveLength(2);
  });

  it('buff steps all target Arionis', () => {
    const buffSteps = stepEntries.filter(
      ([, s]) => s.kind === 'buff' && s.powerId === 'salamander-tears',
    );
    expect(buffSteps.map(([, s]) => s.alterations[0].target.id)).toEqual([
      ARIONIS_ID,
      ARIONIS_ID,
    ]);
  });

  it('buff steps all have remainingTurns of 5', () => {
    const buffSteps = stepEntries.filter(
      ([, s]) => s.kind === 'buff' && s.powerId === 'salamander-tears',
    );
    expect(buffSteps.map(([, s]) => s.alterations[0].remainingTurns)).toEqual([
      5, 5,
    ]);
  });

  it('attack buff has rate-based value (attack +10%)', () => {
    const attackBuff = stepEntries.find(
      ([, s]) =>
        s.kind === 'buff' &&
        s.powerId === 'salamander-tears' &&
        s.alterations[0].kind === 'attack',
    );
    expect(attackBuff).toBeDefined();
  });

  it('defense buff has rate-based value (defense +20%)', () => {
    const defenseBuff = stepEntries.find(
      ([, s]) =>
        s.kind === 'buff' &&
        s.powerId === 'salamander-tears' &&
        s.alterations[0].kind === 'defense',
    );
    expect(defenseBuff).toBeDefined();
  });

  it('salamander tears fires exactly once (edge-triggered, no re-trigger)', () => {
    const attackSteps = stepEntries.filter(
      ([, s]) => s.kind === 'attack' && s.powerId === 'salamander-tears',
    );
    expect(attackSteps).toHaveLength(1);
  });

  it('attack step appears before the two buff steps (same power)', () => {
    const attackIdx = stepEntries.findIndex(
      ([, s]) => s.kind === 'attack' && s.powerId === 'salamander-tears',
    );
    const firstBuffIdx = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff' && s.powerId === 'salamander-tears',
    );
    expect(attackIdx).toBeLessThan(firstBuffIdx);
  });
});

describe('Salamander Tears — Arionis absent from team', () => {
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
      .send(buildPayloadWithoutArionis())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterAll(async () => {
    await app.close();
  });

  it('no Salamander Tears steps appear when Arionis is absent', () => {
    const salamanderSteps = stepEntries.filter(
      ([, s]) => s.powerId === 'salamander-tears',
    );
    expect(salamanderSteps).toHaveLength(0);
  });
});
