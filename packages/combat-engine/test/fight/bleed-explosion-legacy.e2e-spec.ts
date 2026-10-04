import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const LEGACY = 'Héritage';

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
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
      damages: [{ type: 'PHYSICAL', rate: 0.01 }],
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

// The special lays the stacks, the ultimate detonates them and opens the
// stance; the prey, faster, strikes 100 per hit.
const scythra = (health: number) =>
  card('scythra', {
    health,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Dissection Éolienne',
        damages: [{ type: 'PHYSICAL', rate: 0.01 }],
        energy: 10,
        targetingStrategy: 'position-based',
        effect: {
          type: 'BLEED',
          rate: 0.01,
          duration: 10,
          maxStacks: 20,
          stacks: 6,
        },
      },
      simpleAttack: {
        name: 'Lacération du Zéphyr',
        damages: [{ type: 'PHYSICAL', rate: 0.01 }],
        targetingStrategy: 'position-based',
      },
      others: [
        {
          kind: 'CONDITIONAL_ATTACK',
          name: 'Exsanguination Totale',
          event: 'turn-start',
          targetingStrategy: 'first-bleeding-enemy',
          stackThreshold: 5,
          energyCost: 10,
          bleedDetonation: { ratePerStack: 0.01 },
          stanceActivation: { name: 'transe-predatrice', duration: 2 },
        },
        {
          kind: 'BLEED_DETONATION',
          name: LEGACY,
          rate: 0.2,
          event: 'self-death',
          requiresStance: 'transe-predatrice',
        },
      ],
    },
  });

describe('Héritage bleed explosion', () => {
  let app: INestApplication;

  const fight = async (scythraHealth: number) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [scythra(scythraHealth)] },
        player2: { name: 'P2', deck: [card('prey', { speed: 20 })] },
      });
    return Object.values(response.body) as any[];
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('when Scythra dies while the stance runs', () => {
    let steps: any[];
    let explosion: any;

    beforeEach(async () => {
      steps = await fight(550);
      explosion = steps.find((s) => s.name === LEGACY);
    });

    it('deals 20% of her attack to the bleeding prey', () => {
      expect(explosion.damages.map((d) => [d.defender.id, d.damage])).toEqual([
        ['prey', 20],
      ]);
    });

    it('leaves no stack to bleed afterwards', () => {
      const bleedTicksAfter = steps
        .slice(steps.indexOf(explosion))
        .filter((s) => s.kind === 'state_effect' && s.type === 'bleed');

      expect(bleedTicksAfter).toEqual([]);
    });
  });

  it('does nothing when Scythra dies after the stance ended', async () => {
    const steps = await fight(650);

    expect(steps.some((s) => s.name === LEGACY)).toBe(false);
  });

  it('dies after the stance ended in that fight', async () => {
    const steps = await fight(650);

    expect(
      steps.some(
        (s) =>
          s.kind === 'status_change' &&
          s.status === 'dead' &&
          s.card.id === 'scythra',
      ),
    ).toBe(true);
  });
});
