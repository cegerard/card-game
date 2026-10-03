import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const SPLASH = 'Vent Écarlate';

const exsanguination = {
  kind: 'CONDITIONAL_ATTACK',
  name: 'Exsanguination Totale',
  event: 'turn-start',
  targetingStrategy: 'first-bleeding-enemy',
  stackThreshold: 5,
  energyCost: 10,
  bleedDetonation: { ratePerStack: 0.4 },
  defensePenetration: 0.5,
  splash: {
    name: SPLASH,
    damages: [{ type: 'AIR', rate: 0.6 }],
    effects: [
      { type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20, stacks: 3 },
    ],
  },
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 1,
  defense: 0,
  health: 100000,
  speed: 10,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'PHYSICAL',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      energy: 1000,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

const scythra = card('scythra', {
  attack: 100,
  skills: {
    ...card('x').skills,
    simpleAttack: {
      name: 'Lacération du Zéphyr',
      damages: [{ type: 'PHYSICAL', rate: 1.0 }],
      targetingStrategy: 'position-based',
      effects: [
        { type: 'BLEED', rate: 0.05, duration: 10, maxStacks: 20, stacks: 6 },
      ],
    },
    others: [exsanguination],
  },
});

const ENEMIES = ['left', 'center', 'right'];

describe('Vent Écarlate splash', () => {
  let app: INestApplication;
  let steps: any[];
  let splashIndex: number;

  const firstBleedAfterSplash = (id: string) =>
    steps
      .slice(splashIndex)
      .find(
        (s) =>
          s.kind === 'status_change' &&
          s.status === 'bleed' &&
          s.card.id === id,
      );

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: {
          name: 'P1',
          deck: [card('ally-1'), scythra, card('ally-2')],
        },
        player2: { name: 'P2', deck: ENEMIES.map((id) => card(id)) },
      });
    steps = Object.values(response.body);
    splashIndex = steps.findIndex((s) => s.name === SPLASH);
  });

  afterEach(async () => {
    await app.close();
  });

  it('follows the detonation', () => {
    expect(steps[splashIndex - 1].name).toBe('Exsanguination Totale');
  });

  it('strikes the target and both its neighbors', () => {
    expect(steps[splashIndex].damages.map((d) => d.defender.id)).toEqual(
      ENEMIES,
    );
  });

  it('deals wind damage', () => {
    expect(
      steps[splashIndex].damages.every(
        (d) => d.damage > 0 && d.kind.includes('AIR'),
      ),
    ).toBe(true);
  });

  it.each(ENEMIES)('leaves %s with 3 bleed stacks', (id) => {
    expect(firstBleedAfterSplash(id).stacks).toBe(3);
  });
});
