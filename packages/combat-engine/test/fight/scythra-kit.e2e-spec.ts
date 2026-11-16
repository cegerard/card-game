import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const LACERATION = 'Lacération du Zéphyr';
const DISSECTION = 'Dissection Éolienne';
const AERO_TRACKER = 'Aéro-traqueur';
const AERO_ACCURACY = 'Aéro-traqueur - Précision';
const ANATOMY = 'Anatomie Prédatrice';
const QUARRY = 'Anatomie Prédatrice - Curée';
const RED_WIND = 'Lames du Vent Rouge';
const BLOODLETTING = 'Lames du Vent Rouge - Saignée';
const EXSANGUINATION = 'Exsanguination Totale';
const SCARLET_WIND = 'Vent Écarlate';
const SHOCK = 'Choc Hémorragique';
const LEGACY = 'Héritage sanglant';

const scythra = rosterCard('scythra');

// Every attack of Scythra's kit reads her attack x (1 + 2% per bleed stack on
// the board): the comments below give the stacks each value was read with.

const bleedsOn = (steps: any[], id: string) =>
  ofKind(steps, 'status_change').filter(
    (s) => s.status === 'bleed' && s.card.id === id,
  );
const bleedTicksOn = (steps: any[], id: string) =>
  steps.filter(
    (s) => s.kind === 'state_effect' && s.type === 'bleed' && s.card.id === id,
  );
const after = (steps: any[], name: string) =>
  steps.slice(steps.findIndex((s) => s.name === name) + 1);

/** A card whose plain attack lays bleed stacks and nothing else. */
const bleeder = (effect: object, targetingStrategy = 'position-based') =>
  dummy('bleeder', {
    skills: {
      ...dummy('bleeder').skills,
      simpleAttack: {
        name: 'Cut',
        damages: [{ type: 'PHYSICAL', rate: 0 }],
        targetingStrategy,
        effects: [{ type: 'BLEED', duration: 3, maxStacks: 8, ...effect }],
      },
    },
  });

// 100 agility, +50% from the start of the fight
const hasty = () =>
  dummy('foe', {
    attack: 10,
    agility: 100,
    skills: {
      ...dummy('foe').skills,
      others: [
        {
          kind: 'ALTERATION',
          name: 'Haste',
          event: 'fight-start',
          targetingStrategy: 'self',
          polarity: 'buff',
          buffType: 'agility',
          rate: 0.5,
          duration: 0,
        },
      ],
    },
  });

describe('Scythra full kit', () => {
  const fight = useFight();

  // High rolls everywhere: nothing in her kit rolls but criticals, off here
  beforeEach(() => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99);
  });
  const alone = (overrides = {}) =>
    fight([scythra], [dummy('foe', { attack: 10, ...overrides })]);

  describe(LACERATION, () => {
    // No stack yet: 51 physical + 34 air
    it('[SCY-ATK-1] strikes for 60% physical and 40% air', async () => {
      const steps = await alone();

      expect(named(steps, 'attack', LACERATION)[0].damages[0]).toMatchObject({
        damage: 85,
        kind: ['PHYSICAL', 'AIR'],
      });
    });

    it('[SCY-ATK-2] lays a bleed stack of 5% of her attack for 3 turns', async () => {
      const steps = await alone();

      expect(bleedTicksOn(steps, 'foe')[0]).toMatchObject({
        damage: 4.25,
        remainingStacks: 1,
        remainingTurns: 2,
      });
    });

    // Right after Vent Écarlate, the foe carries 3 stacks: 85 x 1.06 = 90.1,
    // physical 54.06 x 1.2 = 64.87 -> 65, air 36.04 -> 36
    it('[SCY-ATK-3] hits a target bearing 3 stacks 20% harder in physical', async () => {
      const steps = await alone();

      expect(
        named(after(steps, SCARLET_WIND), 'attack', LACERATION)[0].damages[0]
          .damage,
      ).toBe(101);
    });
  });

  describe(DISSECTION, () => {
    it('[SCY-SPE-1] is cast on her fourth action, once 30 energy are charged', async () => {
      const steps = await alone();

      expect(actionsOf(steps, 'scythra').indexOf(DISSECTION)).toBe(3);
    });

    // 2 stacks on the board: 85 x 1.04 x 0.35 = 30.94 -> 31
    it('[SCY-SPE-1] strikes four times for 35% physical', async () => {
      const steps = await alone();

      expect(named(steps, 'special_attack', DISSECTION)[0].damages).toEqual([
        expect.objectContaining({ damage: 31, kind: ['PHYSICAL'] }),
        expect.anything(),
        expect.anything(),
        expect.anything(),
      ]);
    });

    it('[SCY-SPE-2] lays 2 stacks a hit, up to 8', async () => {
      const steps = await alone();

      expect(
        bleedsOn(after(steps, DISSECTION), 'foe')
          .slice(0, 3)
          .map((s) => s.stacks),
      ).toEqual([4, 6, 8]);
    });

    it('[SCY-SPE-3] lays stacks that bleed for 4 turns', async () => {
      const steps = await alone();

      expect(
        bleedTicksOn(after(steps, DISSECTION), 'foe')[0].remainingTurns,
      ).toBe(3);
    });

    it('[SCY-SPE-4] keeps 10 energy when her accuracy beats the target dodge by more than 20', async () => {
      const steps = await alone();

      expect(named(steps, 'special_attack', DISSECTION)[0].energy).toBe(10);
    });

    // 95 x 1.15 = 109.25 accuracy against 100 agility: a margin of 9.25
    it('[SCY-SPE-4] empties her gauge when the margin is 20 or less', async () => {
      const steps = await alone({ agility: 100 });

      expect(named(steps, 'special_attack', DISSECTION)[0].energy).toBe(0);
    });
  });

  describe(AERO_TRACKER, () => {
    it('[SCY-AER-1] sharpens her accuracy by 15% from the start', async () => {
      const steps = await alone();

      expect(steps[1]).toMatchObject({
        kind: 'buff',
        name: AERO_ACCURACY,
        alterations: [
          expect.objectContaining({ kind: 'accuracy', value: 14.25 }),
        ],
      });
    });

    // 95 alone would miss 100 agility
    it('[SCY-AER-1] hits a target her base accuracy would miss', async () => {
      const steps = await alone({ agility: 100 });

      expect(named(steps, 'attack', LACERATION)[0].damages[0].dodge).toBe(
        false,
      );
    });

    // 100 agility + 50% from a fight-start buff = 150: she misses until the
    // foe bleeds, then it dodges with its 100 base agility
    it('[SCY-AER-2] strips a bleeding enemy of its dodge buffs', async () => {
      const steps = await fight([scythra, bleeder({ rate: 0.01 })], [hasty()]);

      expect(
        named(steps, 'attack', LACERATION)
          .slice(0, 2)
          .map((s) => s.damages[0].dodge),
      ).toEqual([true, false]);
    });
  });

  describe(ANATOMY, () => {
    // 1 stack: 85 x 1.02 = 86.7, 52.02 -> 52 physical + 34.68 -> 35 air
    it('[SCY-ANA-1] raises her attack by 2% a bleed stack on the board', async () => {
      const steps = await alone();

      expect(named(steps, 'attack', LACERATION)[1].damages[0].damage).toBe(87);
    });

    // 24 stacks laid at once: capped at +30%, 110.5 attack;
    // physical 66.3 x 1.2 = 79.56 -> 80, air 44.2 -> 44
    it('[SCY-ANA-1] caps the raise at 30%', async () => {
      const steps = await fight(
        [scythra, bleeder({ rate: 0.0001, stacks: 8 }, 'target-all')],
        [dummy('a'), dummy('b'), dummy('c')],
      );

      expect(named(steps, 'attack', LACERATION)[1].damages[0].damage).toBe(124);
    });

    // Bleed alone can hurt a 2000 defense prey; it hits her 260 a turn
    it('[SCY-ANA-2] heals her 10% of her max health when a prey bleeds out', async () => {
      const steps = await fight(
        [rosterCard('scythra', { health: 3000 })],
        [dummy('prey', { attack: 300, health: 200, defense: 2000 })],
      );

      expect(named(steps, 'healing', QUARRY)[0].heal[0].healed).toBe(300);
    });
  });

  describe(RED_WIND, () => {
    it('[SCY-LAM-1] opens once, after she laid 10 stacks', async () => {
      const steps = await alone();

      expect(
        ofKind(steps, 'stance_started').filter((s) => s.name === 'vent-rouge'),
      ).toHaveLength(1);
    });

    it('[SCY-LAM-2] makes each of her hits lay one more stack', async () => {
      const steps = await alone();

      expect(
        bleedsOn(after(steps, 'vent-rouge'), 'foe')
          .slice(0, 2)
          .map((s) => s.stacks),
      ).toEqual([3, 5]);
    });

    // 3 stacks of Vent Écarlate at 5% of 85, 2 of Lacération at 8% of 90.1
    it('[SCY-LAM-2] makes her stacks bleed 8% of her attack', async () => {
      const steps = await alone();

      expect(bleedTicksOn(after(steps, 'vent-rouge'), 'foe')[0].damage).toBe(
        27.17,
      );
    });

    it('[SCY-LAM-2] lasts three turns', async () => {
      const steps = await alone();

      expect(
        steps.find(
          (s) => s.kind === 'stance_started' && s.name === 'vent-rouge',
        ).remainingTurns,
      ).toBe(3);
    });

    it('[SCY-LAM-3] quickens her by 20% for 3 turns', async () => {
      const steps = await alone();

      expect(named(steps, 'buff', RED_WIND)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'speed',
          value: 17,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[SCY-LAM-2] is the stance her bloodletting reads', async () => {
      const bloodletting = scythra.skills.others.find(
        (s) => s.name === BLOODLETTING,
      );

      expect(bloodletting.requiresStance).toBe('vent-rouge');
    });
  });

  describe(EXSANGUINATION, () => {
    it('[SCY-EXS-1] fires only on a target bearing 5 stacks or more', async () => {
      const steps = await alone();

      expect(
        named(steps, 'attack', EXSANGUINATION).every(
          (s) => s.damages[0].consumedBleedStacks >= 5,
        ),
      ).toBe(true);
    });

    it('[SCY-EXS-1] waits for the fifth stack', async () => {
      const steps = await alone();
      const first = steps.findIndex((s) => s.name === EXSANGUINATION);

      expect(
        Math.max(
          ...bleedsOn(steps.slice(0, first), 'foe').map((s) => s.stacks),
        ),
      ).toBeGreaterThanOrEqual(5);
    });

    it('[SCY-EXS-2] spends 10 energy at turn start', async () => {
      const steps = await alone();

      // Dissection Éolienne left her 10
      expect(named(steps, 'attack', EXSANGUINATION)[0].energy).toBe(0);
    });

    // Her attack is read before the 7 stacks are consumed, so Anatomie
    // Prédatrice counts them: 85 x 1.14 = 96.9; 0.4 x 7 x 96.9 = 271.32 -> 271
    it('[SCY-EXS-3] deals 40% of her attack, raised by the stacks it consumes, a stack', async () => {
      const steps = await alone();

      expect(
        named(steps, 'attack', EXSANGUINATION)[0].damages[0],
      ).toMatchObject({
        damage: 271,
        consumedBleedStacks: 7,
      });
    });

    // 271.32 less half of 100 defense = 221.32 -> 221
    it('[SCY-EXS-3] ignores half the target defense', async () => {
      const steps = await alone({ defense: 100 });

      expect(named(steps, 'attack', EXSANGUINATION)[0].damages[0].damage).toBe(
        221,
      );
    });

    it('[SCY-EXS-3] leaves the target without a stack', async () => {
      const steps = await alone();
      const first = steps.findIndex((s) => s.name === EXSANGUINATION);

      expect(bleedsOn(steps.slice(first, first + 3), 'foe')).toEqual([]);
    });

    // foe: 0 stack left, 0.6 x 85 = 51; b: the foe bleeds 3 again, 0.6 x 90.1
    it('[SCY-EXS-4] strikes the target and its neighbors for 60% air', async () => {
      const steps = await fight(
        [scythra],
        [dummy('foe', { attack: 10 }), dummy('b')],
      );

      expect(named(steps, 'attack', SCARLET_WIND)[0].damages).toEqual([
        expect.objectContaining({ damage: 51, kind: ['AIR'] }),
        expect.objectContaining({ damage: 54, kind: ['AIR'] }),
      ]);
    });

    it('[SCY-EXS-4] lays 3 stacks on each of them', async () => {
      const steps = await fight(
        [scythra],
        [dummy('foe', { attack: 10 }), dummy('b')],
      );

      expect(bleedsOn(after(steps, SCARLET_WIND), 'b')[0].stacks).toBe(3);
    });

    // The 2000 defense prey, worn out by bleeding, falls under 30%
    it('[SCY-EXS-5] shocks a target left under 30%: defense -40%, regeneration -80% for 4 turns', async () => {
      const steps = await fight(
        [scythra],
        [
          dummy('prey', {
            attack: 10,
            health: 200,
            defense: 2000,
            regeneration: 10,
          }),
        ],
      );

      expect(named(steps, 'debuff', SHOCK)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'defense',
          value: 800,
          remainingTurns: 4,
        }),
        expect.objectContaining({
          kind: 'regeneration',
          value: 8,
          remainingTurns: 4,
        }),
      ]);
    });

    // 700 health: the 160 a turn of the foe kills her in her trance
    const falling = () =>
      fight(
        [rosterCard('scythra', { health: 700 })],
        [dummy('foe', { attack: 200 }), dummy('b')],
      );

    it('[SCY-EXS-6] blows up every bleed on the board when she dies in her trance', async () => {
      const steps = await falling();

      expect(
        named(steps, 'attack', LEGACY)[0].damages.map((d) => d.defender.id),
      ).toEqual(['foe', 'b']);
    });

    // 10 stacks on the board when she falls: 85 x 1.2 x 0.2
    it('[SCY-EXS-6] deals 20% of her attack to each', async () => {
      const steps = await falling();

      expect(
        named(steps, 'attack', LEGACY)[0].damages.map((d) => d.damage),
      ).toEqual([20.4, 20.4]);
    });
  });
});
