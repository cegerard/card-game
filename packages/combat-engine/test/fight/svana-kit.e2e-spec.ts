import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const svana = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
).find((card) => card.id === 'svana');

const BREATH = 'Souffle Cristallin';
const EMBRACE = 'Étreinte du Cygne Glacé';
const ANALYSIS = 'Analyse Aérienne';
const COUNTER = 'Grâce Trompeuse - Éclat de Givre';
const STORM = 'Tempête Focalisée';
const WALTZ = 'Valse du Cygne Noir';
const CRYSTALS = 'Valse du Cygne Noir - Tempête de Cristaux';

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

// Without criticals every hit lands the same from one run to the next.
const swan = { ...svana, criticalChance: 0 };

// Without her analysis, nothing sets the ultimate off early.
const focused = {
  ...swan,
  skills: {
    ...swan.skills,
    others: swan.skills.others.filter((skill) => skill.kind !== 'ANALYSIS'),
  },
};

const named = (steps: any[], kind: string, name: string) =>
  steps.filter((s) => s.kind === kind && s.name === name);

// The step `offset` places after the first one carrying every field of `match`.
const after = (steps: any[], match: object, offset = 1) =>
  steps[
    steps.findIndex((s) =>
      Object.entries(match).every(([key, value]) => s[key] === value),
    ) + offset
  ];

// A guard against control keeps the enemy attacking, and so analysed, under freezes.
const unfreezable = (id: string) =>
  card(id, {
    skills: {
      ...card(id).skills,
      others: [
        {
          kind: 'STANCE',
          name: 'Garde',
          event: 'fight-start',
          stanceActivation: {
            name: 'garde',
            duration: 100,
            immunities: ['control'],
          },
        },
      ],
    },
  });

describe('Svana full kit', () => {
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

  describe('breathing Souffle Cristallin', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight([focused], [card('prey')]);
    });

    it('lays a Marque Thermique for two turns', () => {
      expect(after(steps, { kind: 'attack', name: BREATH })).toMatchObject({
        kind: 'weak_point_revealed',
        name: 'Marque Thermique',
        remainingTurns: 2,
      });
    });

    it('casts Tempête Focalisée on its cooldown', () => {
      expect(named(steps, 'attack', STORM).length).toBeGreaterThan(0);
    });
  });

  describe('casting Étreinte du Cygne Glacé', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight([focused], [card('prey')]);
    });

    it('drains the attack, freezes and reveals a critical weak point', () => {
      const cast = { kind: 'special_attack', name: EMBRACE };
      const names = [1, 2, 3].map((i) => after(steps, cast, i));

      expect(names.map((s) => s.name ?? s.status)).toEqual([
        EMBRACE,
        'freeze',
        'Point Faible Critique',
      ]);
    });

    it('lays a hypothermia when the next hit strikes the weak point', () => {
      const struck = { kind: 'weak_point_ended', reason: 'struck' };

      expect(after(steps, struck)).toMatchObject({
        kind: 'status_change',
        status: 'hypothermia',
      });
    });

    it('bites 15% of the target max health each turn', () => {
      const bites = steps.filter(
        (s) => s.kind === 'state_effect' && s.type === 'hypothermia',
      );

      expect(bites.slice(0, 3).map((s) => s.damage)).toEqual([
        1500, 1500, 1500,
      ]);
    });
  });

  describe('analysing the enemies', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight([swan], [card('prey')]);
    });

    it('lays one charge per enemy attack up to three', () => {
      const charges = named(steps, 'analysis_charged', ANALYSIS).map(
        (s) => s.charges,
      );

      expect(charges).toEqual([1, 2, 3]);
    });

    it('reveals a lasting weak point with the third charge', () => {
      const third = { kind: 'analysis_charged', charges: 3 };

      expect(after(steps, third)).toMatchObject({
        kind: 'weak_point_revealed',
        name: 'Point Faible',
      });
    });

    it('sets the ultimate off once every enemy is analysed', () => {
      const third = { kind: 'analysis_charged', charges: 3 };

      expect(after(steps, third, 2)).toMatchObject({
        kind: 'transformation_started',
        name: WALTZ,
      });
    });

    it('freezes every enemy as the ultimate starts', () => {
      const waltz = steps.findIndex((s) => s.kind === 'transformation_started');
      const freeze = steps.findIndex(
        (s, i) => i > waltz && s.status === 'freeze',
      );

      expect(steps[freeze].card.name).toBe('prey');
    });

    it('reveals every enemy weak point for the ultimate', () => {
      expect(
        named(steps, 'weak_point_revealed', 'Omniscience Tactique')[0],
      ).toMatchObject({
        remainingTurns: 3,
      });
    });
  });

  describe('dodging an attack', () => {
    it('answers with Éclat de Givre', async () => {
      const steps = await fight([focused], [card('clumsy', { accuracy: 0 })]);

      expect(named(steps, 'attack', COUNTER).length).toBeGreaterThan(0);
    });
  });

  describe('attacking during the ultimate', () => {
    it('shatters crystals on the neighbors of her target', async () => {
      const steps = await fight(
        [swan],
        [unfreezable('left'), unfreezable('right')],
      );
      const crystals = named(steps, 'attack', CRYSTALS)[0];

      expect(crystals.damages.map((d) => d.defender.name)).toEqual(['right']);
    });
  });

  describe('dying during the ultimate', () => {
    let steps: any[];

    beforeEach(async () => {
      steps = await fight(
        [focused],
        [card('brute', { attack: 470, element: 'PHYSICAL' })],
      );
    });

    it('leaves the weak points she revealed for good', () => {
      const death = { kind: 'status_change', status: 'dead' };

      expect(after(steps, death)).toEqual({
        kind: 'weak_point_revealed',
        name: 'Omniscience Tactique',
        source: expect.objectContaining({ name: 'Svana' }),
        card: expect.objectContaining({ name: 'brute' }),
      });
    });
  });
});
