import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = join(fileURLToPath(import.meta.url), '..');

const roster = JSON.parse(
  readFileSync(join(__dirname, '../../samples/cards.json'), 'utf-8'),
);

// Without criticals every hit lands the same from one run to the next.
const hyoki = {
  ...roster.find((card) => card.id === 'hyoki'),
  criticalChance: 0,
};

const GALE = 'Rafale Polaire';
const REVIVING_BREATH = 'Rafale Polaire - Souffle Revigorant';
const ENCOURAGING_BREATH = 'Souffle Encourageant';
const LOW_HEALTH_DODGE = 'Souffle Encourageant - Esquive';
const COLONY_SPIRIT = 'Esprit de Colonie';
const MOURNING = 'Esprit de Colonie - Deuil';
const GUST = 'Bourrasque Protectrice';
const CIRCLE = 'Cercle de la Colonie';
const STORM = "Tempête de l'Empereur";
const RAGE = 'Rage de la Colonie';

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

// Charges its special in one turn: its second action is a skill.
const caster = (id: string) =>
  card(id, {
    skills: {
      ...card(id).skills,
      special: { ...card(id).skills.special, energy: 10 },
    },
  });

// Poisons whatever it hits, without damage.
const poisoner = (id: string) =>
  card(id, {
    skills: {
      ...card(id).skills,
      simpleAttack: {
        ...card(id).skills.simpleAttack,
        effects: [{ type: 'POISON', rate: 0.1, level: 3 }],
      },
    },
  });

const named = (steps: any[], kind: string, name: string) =>
  steps.filter((s) => s.kind === kind && s.name === name);

describe('Hyōki full kit', () => {
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

  describe('opening the fight', () => {
    it('grows stronger with each living ally through Esprit de Colonie', async () => {
      const steps = await fight([hyoki, card('a'), card('b')], [card('foe')]);

      expect(named(steps, 'buff', COLONY_SPIRIT)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'attack', value: 6.5 }),
      ]);
    });

    it('raises every stat with Esprit de Colonie', async () => {
      const steps = await fight([hyoki, card('a')], [card('foe')]);

      expect(named(steps, 'buff', COLONY_SPIRIT)).toHaveLength(8);
    });

    it('grants his allies the low-health dodge of Souffle Encourageant', async () => {
      const steps = await fight([hyoki, card('a'), card('b')], [card('foe')]);

      expect(
        named(steps, 'buff', LOW_HEALTH_DODGE)[0].alterations.map(
          (a) => a.target.id,
        ),
      ).toEqual(['a', 'b']);
    });
  });

  describe('Rafale Polaire', () => {
    it('strikes with physical and air damage', async () => {
      const steps = await fight([hyoki, card('a')], [card('foe')]);

      expect(named(steps, 'attack', GALE)[0].damages[0].kind).toEqual([
        'PHYSICAL',
        'AIR',
      ]);
    });

    it('hardens the most wounded ally right after the attack', async () => {
      const steps = await fight([hyoki, card('a')], [card('foe')]);
      const gale = steps.findIndex((s) => s.name === GALE);

      expect(steps[gale + 1]).toMatchObject({
        name: REVIVING_BREATH,
        alterations: [{ target: { id: 'a' }, kind: 'defense' }],
      });
    });
  });

  describe('Souffle Encourageant', () => {
    it('gives him energy when an ally uses a skill', async () => {
      const steps = await fight([hyoki, caster('a')], [card('foe')]);

      expect(named(steps, 'energy_gained', ENCOURAGING_BREATH)[0].amount).toBe(
        3,
      );
    });
  });

  describe('Esprit de Colonie mourning', () => {
    it('raises his attack when an ally falls', async () => {
      const steps = await fight(
        [card('fragile', { health: 1 }), hyoki],
        [card('foe', { attack: 100 })],
      );

      expect(named(steps, 'buff', MOURNING)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'attack', value: 19.5 }),
      ]);
    });
  });

  describe('Bourrasque Protectrice', () => {
    it('shields an ally with a share of his own max health', async () => {
      const steps = await fight([card('a'), hyoki], [card('foe')]);

      expect(named(steps, 'shield_applied', GUST)[0].targets).toEqual([
        { target: expect.objectContaining({ id: 'a' }), points: 208 },
      ]);
    });

    it('cleanses a status of that ally', async () => {
      const steps = await fight([card('a'), hyoki], [poisoner('foe')]);

      expect(named(steps, 'effect_cleansed', GUST)[0]).toMatchObject({
        card: { id: 'a' },
        effectType: 'poison',
      });
    });

    it('quickens that ally', async () => {
      const steps = await fight([card('a'), hyoki], [card('foe')]);

      expect(named(steps, 'buff', GUST)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'speed', remainingTurns: 1 }),
      ]);
    });

    it('takes his third action instead of the attack', async () => {
      const steps = await fight([card('a'), hyoki], [card('foe')]);
      const actions = steps
        .filter((s) => s.name === GALE || s.kind === 'shield_applied')
        .map((s) => s.name);

      expect(actions.slice(0, 4)).toEqual([GALE, GALE, GUST, GALE]);
    });
  });

  describe('Cercle de la Colonie', () => {
    it('lays the circle for two turns', async () => {
      const steps = await fight([card('a'), hyoki], [card('foe')]);

      expect(named(steps, 'battlefield_started', CIRCLE)[0]).toMatchObject({
        source: { id: 'hyoki' },
        remainingTurns: 2,
      });
    });

    it('hardens every member of the circle', async () => {
      const steps = await fight([card('a'), hyoki], [card('foe')]);

      expect(
        named(steps, 'buff', CIRCLE)[0]
          .alterations.filter((a) => a.kind === 'defense')
          .map((a) => a.target.id),
      ).toEqual(['a', 'a', 'hyoki', 'hyoki']);
    });

    it('shares the hits of a member with the others', async () => {
      const steps = await fight(
        [card('a'), hyoki],
        [card('foe', { attack: 100 })],
      );

      expect(named(steps, 'damage_shared', CIRCLE)[0].shares).toEqual([
        expect.objectContaining({
          card: expect.objectContaining({ id: 'hyoki' }),
          damage: 5,
        }),
      ]);
    });
  });

  describe("Tempête de l'Empereur", () => {
    // Strikes Hyōki under 40% in three hits and kills him at the fourth,
    // then turns on his ally.
    const hunted = (ally = card('a', { health: 1000 })) =>
      fight([hyoki, ally], [card('foe', { attack: 200 })]);
    // Brings the ally standing first under 25% in two hits, without touching Hyōki.
    const allyInDanger = () =>
      fight(
        [card('a', { health: 1000 }), hyoki],
        [card('foe', { attack: 400 })],
      );

    it('rises when he falls under 40% of his health', async () => {
      const steps = await hunted();

      expect(named(steps, 'transformation_started', STORM)).toHaveLength(1);
    });

    it('rises when an ally falls under 25% of its health', async () => {
      const steps = await allyInDanger();

      expect(named(steps, 'transformation_started', STORM)).toHaveLength(1);
    });

    it('lays the storm on the battlefield for three turns', async () => {
      const steps = await allyInDanger();

      expect(named(steps, 'battlefield_started', STORM)[0].remainingTurns).toBe(
        3,
      );
    });

    it('empowers the attack and speed of his allies', async () => {
      const steps = await allyInDanger();

      expect(
        named(steps, 'buff', STORM)[0]
          .alterations.filter((a) => a.target.id === 'a')
          .map((a) => a.kind),
      ).toEqual(['attack', 'speed']);
    });

    it('heals its side a tenth of their max health each turn', async () => {
      const steps = await hunted();

      const heals = named(steps, 'healing', STORM).flatMap((s) => s.heal);

      expect(heals[0]).toMatchObject({ target: { id: 'a' }, healed: 100 });
    });

    it('blinds the enemies', async () => {
      const steps = await allyInDanger();

      expect(named(steps, 'debuff', STORM)[0].alterations).toEqual([
        expect.objectContaining({
          target: expect.objectContaining({ id: 'foe' }),
          kind: 'accuracy',
        }),
      ]);
    });

    it('strikes the enemies with air each turn', async () => {
      const steps = await allyInDanger();

      expect(named(steps, 'attack', STORM)[0].damages[0].kind).toEqual(['AIR']);
    });

    it('brings back an ally fallen in the last turns', async () => {
      const steps = await fight(
        [card('fragile', { health: 100 }), card('b', { health: 500 }), hyoki],
        [card('foe', { attack: 400 })],
      );

      expect(named(steps, 'revived', STORM)[0]).toMatchObject({
        card: { id: 'fragile' },
        remainingHealth: 30,
      });
    });

    describe('when Hyōki falls under it', () => {
      it('lasts two more turns', async () => {
        const steps = await hunted();

        expect(named(steps, 'battlefield_extended', STORM)[0].extraTurns).toBe(
          2,
        );
      });

      it('makes the next attack of his allies deal 50% more, once', async () => {
        const steps = await hunted(card('a', { attack: 100 }));
        const rage = steps.findIndex((s) => s.kind === 'attack_empowered');
        const attacksOfA = steps
          .slice(rage)
          .filter((s) => s.kind === 'attack' && s.attacker.id === 'a')
          .map((s) => s.damages[0].damage);

        expect(attacksOfA.slice(0, 2)).toEqual([203, 135]);
      });

      it('fills his allies with Rage de la Colonie', async () => {
        const steps = await hunted();

        expect(
          named(steps, 'attack_empowered', RAGE)[0].cards.map((c) => c.id),
        ).toEqual(['a']);
      });
    });
  });
});
