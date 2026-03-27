import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe("Lion's Inheritance — ally-death trigger + event-bound buff", () => {
  let app: INestApplication;
  let stepEntries: [string, any][];
  let deathIndex: number;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(buildAllyDeathPayload())
      .expect(200);

    stepEntries = Object.entries(response.body) as [string, any][];
    deathIndex = stepEntries.findIndex(
      ([, s]) =>
        s.kind === 'status_change' &&
        s.card?.name === 'Kaelion' &&
        s.status === 'dead',
    );
  });

  afterEach(async () => {
    await app.close();
  });

  it('buff step immediately follows kaelion death step', () => {
    expect(stepEntries[deathIndex + 1][1]).toMatchObject({
      kind: 'buff',
      source: { name: 'Arionis' },
    });
  });

  it('buff_removed step immediately follows the buff step', () => {
    expect(stepEntries[deathIndex + 2][1]).toMatchObject({
      kind: 'buff_removed',
      eventName: 'lion-heritage-end',
    });
  });

  it('no buff steps appear after buff_removed step', () => {
    const buffRemovedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
    const buffAfterRemoval = stepEntries
      .slice(buffRemovedIndex + 1)
      .some(([, s]) => s.kind === 'buff');
    expect(buffAfterRemoval).toBe(false);
  });
});

function buildAllyDeathPayload() {
  return {
    cardSelectorStrategy: 'player-by-player',
    player1: {
      name: 'Lions Team',
      deck: [
        {
          id: 'kaelion',
          name: 'Kaelion',
          attack: 10,
          defense: 0,
          health: 1,
          speed: 200,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Roar',
              rate: 1.0,
              energy: 999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Scratch',
              damages: [{ type: 'PHYSICAL', rate: 0.1 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: 'arionis',
          name: 'Arionis',
          attack: 300,
          defense: 50,
          health: 10000,
          speed: 50,
          agility: 0,
          accuracy: 100,
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
                name: 'Héritage du lion',
                rate: 0.4,
                targetingStrategy: 'self',
                event: 'ally-death',
                targetCardId: 'kaelion',
                buffType: 'attack',
                duration: 0,
                terminationEvent: 'lion-heritage-end',
                activationLimit: 1,
                endEvent: 'lion-heritage-end',
              },
            ],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
      ],
    },
    player2: {
      name: 'Enemy Team',
      deck: [
        {
          id: 'enemy',
          name: 'Enemy',
          attack: 9999,
          defense: 0,
          health: 10000,
          speed: 150,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Smash',
              rate: 1.0,
              energy: 999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Strike',
              damages: [{ type: 'PHYSICAL', rate: 5.0 }],
              targetingStrategy: 'position-based',
            },
            others: [],
          },
          behaviors: { dodge: 'simple-dodge' },
        },
        {
          id: 'dummy',
          name: 'Dummy',
          attack: 1,
          defense: 0,
          health: 10000,
          speed: 10,
          agility: 0,
          accuracy: 100,
          criticalChance: 0,
          skills: {
            special: {
              kind: 'ATTACK',
              name: 'Poke',
              rate: 0.1,
              energy: 999,
              targetingStrategy: 'position-based',
            },
            simpleAttack: {
              name: 'Tap',
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

const LIONS_INHERITANCE_PAYLOAD = {
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

describe("Lion's Inheritance scenario (event-bound buff)", () => {
  let app: INestApplication;
  let steps: any[];
  let stepEntries: [string, any][];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send(LIONS_INHERITANCE_PAYLOAD)
      .expect(200);

    steps = Object.values(response.body) as any[];
    stepEntries = Object.entries(response.body) as [string, any][];
  });

  afterEach(async () => {
    await app.close();
  });

  it('produces buff_removed step on 3rd activation', () => {
    const buffRemovedStep = steps.find((s) => s.kind === 'buff_removed');
    expect(buffRemovedStep).toBeDefined();
    expect(buffRemovedStep.eventName).toBe('lions-inheritance-end');
    expect(buffRemovedStep.removed).toHaveLength(1);
    expect(buffRemovedStep.removed[0].kind).toBe('attack');
  });

  it('buff step appears before buff_removed step', () => {
    const buffRemovedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
    const lastBuffIndex = stepEntries.reduce(
      (last, [, s], i) => (s.kind === 'buff' ? i : last),
      -1,
    );
    expect(buffRemovedIndex).toBeGreaterThan(lastBuffIndex);
  });

  it('no buff steps appear after buff_removed step', () => {
    const buffRemovedIndex = stepEntries.findIndex(
      ([, s]) => s.kind === 'buff_removed',
    );
    const buffAfterRemoval = stepEntries
      .slice(buffRemovedIndex + 1)
      .some(([, s]) => s.kind === 'buff');
    expect(buffAfterRemoval).toBe(false);
  });
});
