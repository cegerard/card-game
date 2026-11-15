import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const FANGS = 'Crocs de Marée';
const ABYSS = 'Abysses Impitoyables';
const COLD_BLOOD = 'Sang-froid du chasseur';
const WHIRL = 'Tourbillon Carnassier';
const FRENZY = 'Frénésie du Grand Blanc';

const kaito = rosterCard('kaito');

// Soaking marks laid on a card, in order
const marksOn = (steps: any[], id: string) =>
  ofKind(steps, 'mark_applied').filter((s) => s.card.id === id);

const during = (steps: any[], from: string, to: string) =>
  steps.slice(
    steps.findIndex((s) => s.kind === from),
    steps.findIndex((s) => s.kind === to),
  );

/**
 * Hurts with its special alone: 405 damage at its sixth action, enough to
 * drop Kaito under 25% despite his regeneration; its plain attack only
 * poisons, for 1 a tick.
 */
const brute = () =>
  dummy('foe', {
    attack: 1000,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Blow',
        damages: [{ type: 'PHYSICAL', rate: 0.45 }],
        energy: 50,
        targetingStrategy: 'position-based',
      },
      simpleAttack: {
        name: 'Sting',
        damages: [{ type: 'PHYSICAL', rate: 0 }],
        targetingStrategy: 'position-based',
        effects: [{ type: 'POISON', rate: 0.001, level: 1 }],
      },
      others: [],
    },
  });

describe('Kaito full kit', () => {
  const fight = useFight();

  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  const alone = () => fight([kaito], [dummy('foe', { attack: 10 })]);

  describe(FANGS, () => {
    // 68 physical + 34 water
    it('[KAI-ATK-1] strikes for 80% physical and 40% water', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', FANGS)[0].damages[0]).toMatchObject({
        damage: 102,
        kind: ['PHYSICAL', 'WATER'],
      });
    });

    it('[KAI-ATK-2] soaks its target on a roll under 20%', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(marksOn(steps, 'foe')[0]).toMatchObject({
        damageType: 'WATER',
        stacks: 1,
      });
    });

    it('[KAI-ATK-2] does not soak on a roll of 20% or more', async () => {
      rolling(0.21);
      const steps = await alone();
      const whirl = steps.findIndex((s) => s.name === WHIRL);

      expect(marksOn(steps.slice(0, whirl), 'foe')).toEqual([]);
    });

    // 68 physical + 34 x 1.05 water = 35.7 -> 36
    it('[KAI-ATK-2] raises the water damage its target takes by 5% a mark', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(named(steps, 'attack', FANGS)[1].damages[0].damage).toBe(104);
    });

    it('[KAI-ATK-2] soaks five times at most', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(Math.max(...marksOn(steps, 'foe').map((s) => s.stacks))).toBe(5);
    });
  });

  describe(ABYSS, () => {
    it('[KAI-SPE-1] is cast on his fifth action, once 40 energy are charged', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(actionsOf(steps, 'kaito').indexOf(ABYSS)).toBe(4);
    });

    // b, never struck before, carries no mark: 1.5 x 85 = 127.5
    it('[KAI-SPE-1] strikes every enemy for 150% water', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [dummy('a'), dummy('b')]);

      expect(
        named(steps, 'special_attack', ABYSS)[0].damages.map((d) => d.damage),
      ).toEqual([182, 128]);
    });

    it('[KAI-SPE-1] soaks each enemy struck twice', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [dummy('a'), dummy('b')]);
      const abyss = steps.findIndex((s) => s.name === ABYSS);

      expect(marksOn(steps.slice(abyss), 'b')[0].stacks).toBe(2);
    });

    it('[KAI-SPE-2] sharpens his dodge by 20% until his next turn ends', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'buff', ABYSS)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'agility',
          value: 14,
          remainingTurns: 1,
        }),
      ]);
    });

    // a carries the 2 marks of Tourbillon Carnassier: 127.5 x 1.1 x 1.3
    it('[KAI-SPE-3] hits a soaked enemy 30% harder', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [dummy('a'), dummy('b')]);

      expect(named(steps, 'special_attack', ABYSS)[0].damages[0]).toMatchObject(
        {
          defender: expect.objectContaining({ id: 'a' }),
          damage: 182,
        },
      );
    });
  });

  describe('Courant glacial', () => {
    it('[KAI-COU-1] slows a soaked enemy by 8% on a roll under 30%', async () => {
      rolling(0.1);
      const steps = await alone();
      const soaked = steps.indexOf(marksOn(steps, 'foe')[0]);

      expect(steps[soaked + 1].alterations).toEqual([
        expect.objectContaining({ kind: 'speed', value: 4, remainingTurns: 3 }),
      ]);
    });

    it('[KAI-COU-1] does not slow on a roll of 30% or more', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(ofKind(steps, 'debuff')).toEqual([]);
    });
  });

  describe(COLD_BLOOD, () => {
    // 0.12 x 2.5 = 0.3: 42% in all
    it('[KAI-SAN-1] raises his critical chance to 42% under 40% health', async () => {
      rolling(0.99);
      const steps = await fight(
        [rosterCard('kaito', { criticalChance: 0.12 })],
        [brute()],
      );

      expect(named(steps, 'buff', COLD_BLOOD)[0].alterations[0]).toMatchObject({
        kind: 'criticalChance',
        value: 0.3,
      });
    });

    it('[KAI-SAN-1] waits for his health to fall under 40%', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);
      const raised = steps.findIndex((s) => s.name === COLD_BLOOD);

      expect(steps[raised - 1].damages[0].remainingHealth).toBeLessThan(208);
    });
  });

  describe(WHIRL, () => {
    // 35% of 85 = 29.75 -> 30
    it('[KAI-TOU-1] strikes five times for 35% physical', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(
        named(steps, 'attack', WHIRL)[0]
          .damages.slice(0, 5)
          .map((d) => d.damage),
      ).toEqual([30, 30, 30, 30, 30]);
    });

    // 90% of 85 = 76.5 -> 77
    it('[KAI-TOU-2] finishes with 90% water', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', WHIRL)[0].damages[5]).toMatchObject({
        damage: 77,
        kind: ['WATER'],
      });
    });

    it('[KAI-TOU-2] soaks its target twice with the finisher', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(marksOn(steps, 'foe')[0].stacks).toBe(2);
    });

    // His special counts as an action
    it('[KAI-TOU-3] replaces his attack every third action', async () => {
      rolling(0.99);
      const steps = await alone();
      const actions = actionsOf(steps, 'kaito').slice(0, 9);

      expect(actions.flatMap((name, i) => (name === WHIRL ? [i] : []))).toEqual(
        [2, 5, 8],
      );
    });
  });

  describe(FRENZY, () => {
    it('[KAI-FRE-1] rises once under 25% health, for three turns', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);

      expect(named(steps, 'transformation_started', FRENZY)).toEqual([
        expect.objectContaining({ remainingTurns: 3 }),
      ]);
    });

    it('[KAI-FRE-1] rises on the blow that drops him under 25%', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);
      const risen = steps.findIndex((s) => s.kind === 'transformation_started');

      // 520 max health: regeneration offsets each poison tick but the last,
      // 519 before the blow, 114 after it
      expect(
        steps
          .slice(0, risen)
          .filter((s) => s.kind === 'special_attack')
          .slice(-1)[0].damages[0].remainingHealth,
      ).toBeLessThan(130);
    });

    it('[KAI-FRE-2] raises his attack by 35% and his speed by 20%', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);

      expect(named(steps, 'buff', FRENZY)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'attack',
          value: 29.75,
          remainingTurns: 3,
        }),
        expect.objectContaining({
          kind: 'speed',
          value: 17,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[KAI-FRE-3] heals him 10% of his max health on a landed attack', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);

      expect(named(steps, 'healing', FRENZY)[0].heal[0].healed).toBe(52);
    });

    it('[KAI-FRE-4] refuses every status while it lasts', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);

      expect(
        during(steps, 'transformation_started', 'transformation_ended').filter(
          (s) => s.kind === 'status_change' && s.card.id === 'kaito',
        ),
      ).toEqual([]);
    });

    it('[KAI-FRE-5] costs him 10% of his max health when it ends', async () => {
      rolling(0.99);
      const steps = await fight([kaito], [brute()]);

      expect(ofKind(steps, 'transformation_ended')[0].healthCost).toBe(52);
    });
  });
});
