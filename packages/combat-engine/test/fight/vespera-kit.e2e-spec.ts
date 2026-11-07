import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const vespera = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
).find((card) => card.id === 'vespera');

const NUEE = 'Nuée de Cristaux';
const DANCE = 'Danse du Désert';
const COUNTER = 'Danse du Désert - Dard du Crépuscule';
const QUEEN = 'Reine du Crépuscule';
const ZONE = 'Reine du Crépuscule - Zone toxique';
const EXPLOSION = 'Reine du Crépuscule - Explosion de venin';

const card = (id: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: id,
  attack: 0,
  defense: 0,
  health: 10000,
  speed: 50,
  agility: 0,
  accuracy: 9999,
  criticalChance: 0,
  element: 'WATER',
  skills: {
    special: {
      kind: 'ATTACK',
      name: 'Special',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      energy: 9999,
      targetingStrategy: 'position-based',
    },
    simpleAttack: {
      name: 'Attack',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'position-based',
    },
    others: [],
  },
  behaviors: { dodge: 'simple-dodge' },
  ...overrides,
});

// Without criticals every hit lands the same from one run to the next, and
// her opponents carry no resistance to roll.
const wasp = { ...vespera, criticalChance: 0 };

// The dance rolls a chance; the cornered queen must not dodge by luck.
const queen = {
  ...wasp,
  skills: {
    ...wasp.skills,
    others: wasp.skills.others.filter((skill) => skill.name !== DANCE),
  },
};

describe('Vespera full kit', () => {
  let app: INestApplication;

  const fight = async (player1: object[], player2: object[]) => {
    const response = await request(app.getHttpServer())
      .post('/fight')
      .send({
        cardSelectorStrategy: 'player-by-player',
        player1: { name: 'P1', deck: player1 },
        player2: { name: 'P2', deck: player2 },
      })
      .expect(200);
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

  describe('stinging with Dard du Crépuscule', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight([wasp], [card('prey')]);
    });

    it('adds one Venin Sableux stack per sting up to three', () => {
      const stacks = steps
        .filter((s) => s.kind === 'status_change' && s.status === 'poison')
        .map((s) => s.stacks);

      expect(stacks.slice(0, 4)).toEqual([1, 2, 3, 3]);
    });

    it('doubles the poison tick at each stack (3%, 6%, 12%)', () => {
      const ticks = steps
        .filter((s) => s.kind === 'state_effect' && s.type === 'poison')
        .map((s) => s.damage);

      expect(ticks.slice(0, 3)).toEqual([300, 600, 1200]);
    });
  });

  describe('casting Nuée de Cristaux on an evasive target', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight([wasp], [card('ghost', { agility: 9999 })]);
    });

    it('cannot be dodged', () => {
      const dodges = steps
        .filter((s) => s.name === NUEE)
        .flatMap((s) => s.damages.map((d) => d.dodge));

      expect(dodges).toEqual(expect.not.arrayContaining([true]));
    });

    it('lays two Venin Sableux stacks at once', () => {
      const poison = steps.find(
        (s) => s.kind === 'status_change' && s.status === 'poison',
      );

      expect(poison.stacks).toBe(2);
    });
  });

  describe('dancing out of reach', () => {
    let steps: any[];

    const named = (name: string) => steps.filter((s) => s.name === name);

    beforeEach(async () => {
      steps = await fight(
        [wasp],
        [card('brute', { attack: 100, accuracy: 50, health: 100000 })],
      );
    });

    it('piles Carapace de Sable up to five stacks of defense and agility', () => {
      expect(named('Carapace de Sable')).toHaveLength(10);
    });

    it('opens Danse du Désert', () => {
      expect(named('danse-du-desert').map((s) => s.kind)).toContain(
        'stance_started',
      );
    });

    it('dances with more agility', () => {
      const [dance] = named(DANCE);

      expect(dance.alterations[0].kind).toBe('agility');
    });

    it('stings back the attacker it dodged while dancing', () => {
      expect(named(COUNTER).length).toBeGreaterThan(0);
    });
  });

  describe('when cornered', () => {
    let steps: any[];

    const named = (name: string) => steps.filter((s) => s.name === name);
    const transformation = () =>
      steps.findIndex((s) => s.kind === 'transformation_started');

    beforeEach(async () => {
      steps = await fight(
        [queen],
        [card('brute', { attack: 220, speed: 10, health: 100000 })],
      );
    });

    it('turns into the Reine du Crépuscule under half health', () => {
      expect(steps[transformation()].name).toBe(QUEEN);
    });

    it('opens the queen and untouchable stances', () => {
      const stances = steps
        .filter((s) => s.kind === 'stance_started')
        .map((s) => s.name);

      expect(stances).toEqual(['reine-du-crepuscule', 'intouchable']);
    });

    it('carries every Venin Sableux to three stacks', () => {
      const surge = steps.find(
        (s, i) => i > transformation() && s.kind === 'status_change',
      );

      expect(surge).toEqual(
        expect.objectContaining({ status: 'poison', stacks: 3 }),
      );
    });

    it('doubles the surged poison damage', () => {
      const tick = steps.find(
        (s, i) => i > transformation() && s.kind === 'state_effect',
      );

      expect(tick.damage).toBe(24000);
    });

    it('dodges the first attack once untouchable', () => {
      const strike = steps.find(
        (s, i) => i > transformation() && s.attacker?.id === 'brute',
      );

      expect(strike.damages[0].dodge).toBe(true);
    });

    it('cuts the agility of the enemies', () => {
      const [cut] = named(QUEEN).filter((s) => s.kind === 'debuff');

      expect(cut.alterations[0].kind).toBe('agility');
    });

    it('takes 5% of their max health each turn with Zone toxique', () => {
      expect(named(ZONE)[0].damages[0].damage).toBe(5000);
    });

    it('drops Carapace de Sable at the first hit taken', () => {
      const removed = steps.find((s) => s.kind === 'buff_removed');

      expect(removed.eventName).toBe('damage-taken-vespera');
    });

    it('bursts five Venin Sableux stacks on her death', () => {
      const death = steps.findIndex(
        (s) => s.kind === 'status_change' && s.status === 'dead',
      );

      expect(steps[death + 1]).toEqual(
        expect.objectContaining({ status: 'poison', stacks: 5 }),
      );
    });

    it('blinds the enemies for the rest of the fight', () => {
      const [blind] = named(EXPLOSION);

      expect(blind.alterations[0].kind).toBe('accuracy');
    });
  });

  describe('rejecting a malformed kit', () => {
    const post = (deck: object[]) =>
      request(app.getHttpServer())
        .post('/fight')
        .send({
          cardSelectorStrategy: 'player-by-player',
          player1: { name: 'P1', deck },
          player2: { name: 'P2', deck: [card('prey')] },
        });
    const withSkills = (others: object[]) => ({
      ...wasp,
      skills: { ...wasp.skills, others },
    });

    it('refuses a stacked poison without its stack multiplier', async () => {
      const { stackMultiplier: _dropped, ...venom } =
        wasp.skills.simpleAttack.effects[0];
      const stinger = { ...wasp.skills.simpleAttack, effects: [venom] };
      const skills = { ...wasp.skills, simpleAttack: stinger };

      await post([{ ...wasp, skills }]).expect(400);
    });

    it('refuses a ramping chance on another kind than STANCE', async () => {
      const [carapace] = wasp.skills.others;
      const rampingChance = { startChance: 0.25, increment: 0.1, fromTurn: 3 };

      await post([withSkills([{ ...carapace, rampingChance }])]).expect(400);
    });
  });

  describe('when a poisoned enemy falls', () => {
    it('heals with Instinct de Guêpe', async () => {
      const steps = await fight(
        [wasp],
        [card('weakling', { health: 150 }), card('prey', { attack: 50 })],
      );

      expect(steps.map((s) => s.name)).toContain('Instinct de Guêpe');
    });
  });
});
