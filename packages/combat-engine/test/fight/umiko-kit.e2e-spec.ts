import { jest } from '@jest/globals';
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
const umiko = {
  ...roster.find((card) => card.id === 'umiko'),
  criticalChance: 0,
};

const WHIP = 'Fouet des Marées';
const PRISON = 'Prison des Huit Courants';
const WATER_ZONE = "Prison des Huit Courants - Zone d'eau";
const FLUX_SPEED = 'Flux Adaptatif - Vitesse';
const FLUX_AGILITY = 'Flux Adaptatif - Esquive';
const WHIRLPOOL = 'Tourbillon Entravant';
const TIDE = 'Marée des Possibilités';

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
  element: 'FIRE',
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

const named = (steps: any[], kind: string, name: string) =>
  steps.filter((s) => s.kind === kind && s.name === name);
const ofKind = (steps: any[], kind: string) =>
  steps.filter((s) => s.kind === kind);

// Her own actions, in order: plain attacks, Tourbillon and her special.
const actionsOf = (steps: any[], id: string) =>
  steps
    .filter(
      (s) =>
        ['attack', 'special_attack'].includes(s.kind) && s.attacker.id === id,
    )
    .map((s) => s.name);

describe('Umiko full kit', () => {
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
    jest.restoreAllMocks();
    await app.close();
  });

  // Against a fire card without defense, a share of her 75 attack: physical
  // as is, water x 1.8 (elemental matrix), each part rounded.
  describe('Fouet des Marées', () => {
    it('[UMI-ATK-1] strikes with physical and water damage', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'attack', WHIP)[0].damages[0].kind).toEqual([
        'PHYSICAL',
        'WATER',
      ]);
    });

    it('[UMI-ATK-1] deals 70% of her attack in each part', async () => {
      const steps = await fight([umiko], [card('foe')]);

      // 52.5 physical -> 53, 52.5 x 1.8 = 94.5 water -> 95
      expect(named(steps, 'attack', WHIP)[0].damages[0].damage).toBe(148);
    });

    it('[UMI-ATK-2] slows its target by 15% for a turn', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'debuff', WHIP)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'speed',
          value: 7.5,
          remainingTurns: 1,
        }),
      ]);
    });

    it('[UMI-ATK-3] hits 20% harder in a water battlefield', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
      const steps = await fight(
        [umiko, card('ally')],
        [card('foe', { attack: 90 })],
      );
      const flooded = steps.findIndex((s) => s.kind === 'battlefield_started');

      // 52.5 x 1.2 = 63 physical, 94.5 x 1.2 = 113.4 water -> 113
      expect(
        named(steps.slice(flooded), 'attack', WHIP)[0].damages[0].damage,
      ).toBe(176);
    });
  });

  describe('Flux Adaptatif', () => {
    it('[UMI-FLX-1] quickens her by 5% at each turn end, five times at most', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(
        named(steps, 'buff', FLUX_SPEED).map((s) => s.alterations[0].value),
      ).toEqual([3.5, 3.5, 3.5, 3.5, 3.5]);
    });

    it('[UMI-FLX-1] sharpens her dodge by 3% at each turn end, five times at most', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(
        named(steps, 'buff', FLUX_AGILITY).map((s) => s.alterations[0].value),
      ).toEqual([2.1, 2.1, 2.1, 2.1, 2.1]);
    });

    it('[UMI-FLX-2] fades on a hit costing more than 30% of her health', async () => {
      const steps = await fight([umiko], [card('foe', { attack: 250 })]);

      expect(
        ofKind(steps, 'buff_removed').some(
          (s) => s.eventName === 'damage-taken-umiko',
        ),
      ).toBe(true);
    });

    it('[UMI-FLX-2] holds against lighter hits', async () => {
      const steps = await fight([umiko], [card('foe', { attack: 60 })]);

      expect(ofKind(steps, 'buff_removed')).toEqual([]);
    });
  });

  describe('Intelligence des Profondeurs', () => {
    // Accuracy 75: hits her base agility of 70, misses it raised by 10%.
    it('[UMI-INS-1] dodges an enemy once it has attacked her', async () => {
      const steps = await fight(
        [umiko],
        [card('foe', { attack: 10, accuracy: 75 })],
      );
      const dodges = steps
        .filter((s) => s.kind === 'attack' && s.attacker.id === 'foe')
        .map((s) => s.damages[0].dodge);

      expect(dodges.slice(0, 2)).toEqual([false, true]);
    });

    // Agility 90: dodges her base accuracy of 85, not 85 raised by 15%.
    it('[UMI-INS-2] hits an enemy once it has attacked her', async () => {
      const steps = await fight(
        [umiko],
        [card('foe', { attack: 10, agility: 90 })],
      );

      expect(
        named(steps, 'attack', WHIP)
          .slice(0, 2)
          .map((s) => s.damages[0].dodge),
      ).toEqual([true, false]);
    });
  });

  describe('Tourbillon Entravant', () => {
    it('[UMI-TOU-1] strikes with water only', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(named(steps, 'attack', WHIRLPOOL)[0].damages[0].kind).toEqual([
        'WATER',
      ]);
    });

    it('[UMI-TOU-1] deals 40% of her attack', async () => {
      const steps = await fight([umiko], [card('foe')]);

      // 30 water x 1.8 against fire
      expect(named(steps, 'attack', WHIRLPOOL)[0].damages[0].damage).toBe(54);
    });

    it('[UMI-TOU-2] weakens the defense of its target by 20% for two turns', async () => {
      const steps = await fight([umiko], [card('foe', { defense: 100 })]);

      expect(named(steps, 'debuff', WHIRLPOOL)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'defense',
          value: 20,
          remainingTurns: 2,
        }),
      ]);
    });

    it('[UMI-TOU-3] cuts its target off its allies support for a turn', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(ofKind(steps, 'support_blocked')[0]).toMatchObject({
        card: { id: 'foe' },
        remainingTurns: 1,
      });
    });

    it('[UMI-TOU-4] comes back every third action', async () => {
      const steps = await fight([umiko], [card('foe')]);
      const actions = actionsOf(steps, 'umiko').slice(0, 9);

      expect(
        actions.flatMap((name, i) => (name === WHIRLPOOL ? [i] : [])),
      ).toEqual([2, 5, 8]);
    });
  });

  describe('Prison des Huit Courants', () => {
    const imprison = () => fight([umiko], [card('a'), card('b'), card('c')]);

    it('[UMI-SPE-1] is cast on her fifth action, once 40 energy are charged', async () => {
      const steps = await fight([umiko], [card('foe')]);

      expect(actionsOf(steps, 'umiko').indexOf(PRISON)).toBe(4);
    });

    it('[UMI-SPE-1] seizes two enemies', async () => {
      const steps = await imprison();

      expect(named(steps, 'special_attack', PRISON)[0].damages).toHaveLength(2);
    });

    it('[UMI-SPE-2] entangles both of them', async () => {
      const steps = await imprison();
      const seized = named(steps, 'special_attack', PRISON)[0].damages.map(
        (d) => d.defender.id,
      );

      expect(
        ofKind(steps, 'status_change')
          .filter((s) => s.status === 'entangle')
          .slice(0, 2)
          .map((s) => s.card.id),
      ).toEqual(seized);
    });

    it('[UMI-SPE-2] makes an entangled enemy fail its action on a roll under 70%', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.69);
      const steps = await imprison();

      expect(ofKind(steps, 'action_failed')[0].cause).toBe('entangle');
    });

    it('[UMI-SPE-2] lets an entangled enemy act on a roll of 70% or more', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.71);
      const steps = await imprison();

      expect(ofKind(steps, 'action_failed')).toEqual([]);
    });

    it('[UMI-SPE-3] drains 15 of their energy', async () => {
      // Alone, the enemy acts as often as Umiko and has charged its gauge.
      const steps = await fight([umiko], [card('foe')]);

      expect(ofKind(steps, 'energy_drained')[0].amount).toBe(15);
    });

    it('[UMI-SPE-4] leaves them vulnerable to water for two turns', async () => {
      const steps = await imprison();

      expect(ofKind(steps, 'vulnerability_applied')[0]).toMatchObject({
        damageType: 'WATER',
        rate: 0.5,
        remainingTurns: 2,
      });
    });

    it('[UMI-SPE-5] lowers by 30% the dodge of two adjacent targets', async () => {
      const steps = await fight(
        [umiko],
        [card('a', { agility: 50 }), card('b', { agility: 50 })],
      );

      expect(named(steps, 'debuff', WATER_ZONE)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'agility', value: 15 }),
        expect.objectContaining({ kind: 'agility', value: 15 }),
      ]);
    });
  });

  describe('Marée des Possibilités', () => {
    // High rolls: no clone takes a hit and no entanglement fails an action,
    // unless a test says otherwise.
    beforeEach(() => {
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
    });

    const pressed = () =>
      fight(
        [umiko, card('ally', { accuracy: 100 })],
        [card('foe', { attack: 150, agility: 50 })],
      );
    const healthBefore = (steps: any[], kind: string) =>
      steps
        .slice(
          0,
          steps.findIndex((s) => s.kind === kind),
        )
        .filter(
          (s) => s.kind === 'attack' && s.damages[0].defender.id === 'umiko',
        )
        .map((s) => s.damages[0].remainingHealth);

    it('[UMI-ULT-1] rises once', async () => {
      const steps = await pressed();

      expect(named(steps, 'transformation_started', TIDE)).toHaveLength(1);
    });

    it('[UMI-ULT-1] rises on the hit that leaves her at half her health', async () => {
      const steps = await pressed();

      // 500 max health: 400, 300 (+ 45 regenerated), then 245
      expect(healthBefore(steps, 'transformation_started')).toEqual([
        400, 300, 245,
      ]);
    });

    it('[UMI-ULT-2] turns the battlefield into water for three turns', async () => {
      const steps = await pressed();

      expect(named(steps, 'battlefield_started', TIDE)[0].remainingTurns).toBe(
        3,
      );
    });

    it('[UMI-ULT-2] lets one of three clones take an attack on a roll under 40%', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.39);
      const steps = await pressed();

      expect(named(steps, 'decoy_struck', TIDE)[0].remainingDecoys).toBe(2);
    });

    it('[UMI-ULT-2] lets no clone take an attack on a roll of 40% or more', async () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.41);
      const steps = await pressed();

      expect(ofKind(steps, 'decoy_struck')).toEqual([]);
    });

    it('[UMI-ULT-3] quickens by 25% and sharpens by 20% her allies while it lasts', async () => {
      const steps = await pressed();

      expect(
        named(steps, 'buff', TIDE)[0].alterations.filter(
          (a) => a.target.id === 'ally',
        ),
      ).toEqual([
        expect.objectContaining({
          kind: 'speed',
          value: 12.5,
          remainingTurns: 3,
        }),
        expect.objectContaining({
          kind: 'accuracy',
          value: 20,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[UMI-ULT-4] lowers by 10% the dodge of the enemies', async () => {
      const steps = await pressed();

      expect(named(steps, 'debuff', TIDE)[0].alterations).toEqual([
        expect.objectContaining({ kind: 'agility', value: 5 }),
      ]);
    });

    it('[UMI-ULT-4] raises by 5 the energy the enemy specials cost', async () => {
      const foe = card('foe', { attack: 150 }) as any;
      const special = { ...foe.skills.special, energy: 20 };
      const steps = await fight(
        [umiko, card('ally')],
        [{ ...foe, skills: { ...foe.skills, special } }],
      );

      // The gauge stops at the cost: 20, then 25 in her battlefield
      expect(
        Math.max(
          ...steps
            .filter((s) => s.kind === 'attack' && s.attacker.id === 'foe')
            .map((s) => s.energy),
        ),
      ).toBe(25);
    });

    describe('Héritage de la Tisseuse, when Umiko falls under it', () => {
      const killed = () =>
        fight([umiko, card('ally')], [card('foe', { attack: 400 })]);

      it('[UMI-ULT-5] lasts two more turns', async () => {
        const steps = await killed();

        expect(named(steps, 'battlefield_extended', TIDE)[0].extraTurns).toBe(
          2,
        );
      });

      it('[UMI-ULT-5] lets her clone cast the prison one last time', async () => {
        const steps = await killed();
        const death = steps.findIndex(
          (s) =>
            s.kind === 'status_change' &&
            s.status === 'dead' &&
            s.card.id === 'umiko',
        );

        expect(
          steps
            .slice(death)
            .filter((s) => s.kind === 'attack' && s.name === PRISON),
        ).toHaveLength(1);
      });
    });
  });
});
