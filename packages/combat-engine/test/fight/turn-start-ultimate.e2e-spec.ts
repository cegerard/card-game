import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

const ULTIMATE = 'Exsanguination Totale';

const exsanguination = {
  kind: 'CONDITIONAL_ATTACK',
  name: ULTIMATE,
  event: 'turn-start',
  targetingStrategy: 'first-bleeding-enemy',
  stackThreshold: 5,
  energyCost: 10,
  bleedDetonation: { ratePerStack: 0.4 },
  defensePenetration: 0.5,
};

const card = (id: string, overrides = {}) => ({
  id,
  name: id,
  attack: 100,
  defense: 40,
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

const scythra = (stacksPerHit: number, specialEnergy: number) =>
  card('scythra', {
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Dissection Éolienne',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        energy: specialEnergy,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Lacération du Zéphyr',
        damages: [{ type: 'PHYSICAL', rate: 1.0 }],
        targetingStrategy: 'position-based',
        effects: [
          {
            type: 'BLEED',
            rate: 0.05,
            duration: 10,
            maxStacks: 20,
            stacks: stacksPerHit,
          },
        ],
      },
      others: [exsanguination],
    },
  });

describe('Exsanguination Totale on turn-start', () => {
  let app: INestApplication;

  const fight = async (stacksPerHit: number, specialEnergy: number) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [scythra(stacksPerHit, specialEnergy)] },
        player2: { name: 'P2', deck: [card('prey')] },
      });
    return Object.values(response.body) as any[];
  };
  const scythraActions = (steps: any[]) =>
    steps.filter(
      (s) =>
        (s.kind === 'attack' || s.kind === 'special_attack') &&
        s.attacker.id === 'scythra',
    );

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

  it('rejects a bleed detonation combined with hits', async () => {
    const invalid = scythra(6, 1000);
    invalid.skills.others = [{ ...exsanguination, hits: 2 } as any];

    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: [invalid] },
        player2: { name: 'P2', deck: [card('prey')] },
      });

    expect(response.status).toBe(400);
  });

  describe('against a target bleeding from 6 stacks', () => {
    let steps: any[];
    let ultimate: any;

    beforeEach(async () => {
      steps = await fight(6, 1000);
      ultimate = steps.find((s) => s.name === ULTIMATE);
    });

    it('consumes the 6 stacks', () => {
      expect(ultimate.damages[0].consumedBleedStacks).toBe(6);
    });

    it('deals 6 × 40% of the attack, half the defense ignored', () => {
      expect(ultimate.damages[0].damage).toBe(220);
    });

    it('spends 10 energy', () => {
      expect(ultimate.energy).toBe(0);
    });

    it('then plays the action of the turn', () => {
      const actions = scythraActions(steps);
      const next = actions[actions.indexOf(ultimate) + 1];

      expect(next.name).toBe('Lacération du Zéphyr');
    });

    it('leaves the target to bleed from the new stacks only', () => {
      const bleeds = steps.filter(
        (s) => s.kind === 'status_change' && s.status === 'bleed',
      );

      expect(bleeds[1].stacks).toBe(6);
    });
  });

  describe('when the ultimate takes the special energy below its cost', () => {
    let next: any;
    let ultimate: any;

    beforeEach(async () => {
      const actions = scythraActions(await fight(2, 30));
      ultimate = actions.find((s) => s.name === ULTIMATE);
      next = actions[actions.indexOf(ultimate) + 1];
    });

    it('leaves 20 energy', () => {
      expect(ultimate.energy).toBe(20);
    });

    it('plays a simple attack instead of the special', () => {
      expect(next.name).toBe('Lacération du Zéphyr');
    });
  });
});
