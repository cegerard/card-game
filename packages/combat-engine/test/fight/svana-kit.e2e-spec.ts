import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  statusTicks,
  useFight,
} from '../helpers/kit';

const BREATH = 'Souffle Cristallin';
const EMBRACE = 'Étreinte du Cygne Glacé';
const ANALYSIS = 'Analyse Aérienne';
const GRACE = 'Grâce Trompeuse';
const COUNTER = 'Grâce Trompeuse - Éclat de Givre';
const STORM = 'Tempête Focalisée';
const WALTZ = 'Valse du Cygne Noir';
const MASS_FREEZE = 'Valse du Cygne Noir - Gel de Masse';
const OMNISCIENCE = 'Valse du Cygne Noir - Omniscience Tactique';
const CRYSTALS = 'Valse du Cygne Noir - Tempête de Cristaux';
const SWAN_LEGACY = 'Valse du Cygne Noir - Héritage du Cygne';

const swan = rosterCard('svana');
const without = (card: any, dropped: (skill: any) => boolean) => ({
  ...card,
  skills: {
    ...card.skills,
    others: card.skills.others.filter((skill) => !dropped(skill)),
  },
});
const skillNamed = (name: string, kind?: string) =>
  swan.skills.others.find((s) => s.name === name && (!kind || s.kind === kind));

// Without her analysis, nothing sets the ultimate off early
const focused = without(swan, (skill) => skill.kind === 'ANALYSIS');
// Without Tempête Focalisée, no earlier freeze holds her special's target
const embracing = without(focused, (skill) => skill.name === STORM);

// A guard against control keeps an enemy attacking, so analysed, under freezes
const unfreezable = (id: string) =>
  dummy(id, {
    skills: {
      ...dummy(id).skills,
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

const freezeTicks = (steps: any[], from: number) =>
  statusTicks(steps, 'freeze', 'prey', from);

// The step `offset` places after the first one carrying every field of `match`
const after = (steps: any[], match: object, offset = 1) =>
  steps[
    steps.findIndex((s) =>
      Object.entries(match).every(([key, value]) => s[key] === value),
    ) + offset
  ];

describe('Svana full kit', () => {
  const fight = useFight();

  // Éclat de Givre is the only roll of her kit: high unless a test says otherwise
  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  beforeEach(() => {
    rolling(0.99);
  });

  describe(BREATH, () => {
    // 52.5 -> 53 physical, 52.5 -> 53 air
    it('[SVA-ATK-1] strikes for 70% physical and 70% air', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(named(steps, 'attack', BREATH)[0].damages[0]).toMatchObject({
        damage: 106,
        kind: ['PHYSICAL', 'AIR'],
      });
    });

    it('[SVA-ATK-2] lays a Marque Thermique for two turns', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(after(steps, { kind: 'attack', name: BREATH })).toMatchObject({
        kind: 'weak_point_revealed',
        name: 'Marque Thermique',
        remainingTurns: 2,
      });
    });

    // The ally has no critical chance of its own: the mark lends it 10%
    it('[SVA-ATK-3] lends her allies 10% critical chance against a marked target', async () => {
      rolling(0.05);
      const steps = await fight(
        [focused, dummy('ally', { attack: 100 })],
        [dummy('prey')],
      );

      expect(
        steps.find((s) => s.kind === 'attack' && s.attacker.id === 'ally')
          .damages[0].isCritical,
      ).toBe(true);
    });

    it('[SVA-ATK-3] lends no more than 10%', async () => {
      rolling(0.11);
      const steps = await fight(
        [focused, dummy('ally', { attack: 100 })],
        [dummy('prey')],
      );

      expect(
        steps.find((s) => s.kind === 'attack' && s.attacker.id === 'ally')
          .damages[0].isCritical,
      ).toBe(false);
    });

    // Frozen by Tempête Focalisée: 52.5 x 1.2 = 63 a part, then x 1.2 taken
    // by a frozen card: 151.2
    it('[SVA-ATK-4] hits a frozen target 20% harder', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      const frozen = steps.findIndex((s) => s.status === 'freeze');

      expect(
        named(steps.slice(frozen), 'attack', BREATH)[0].damages[0].damage,
      ).toBe(151);
    });
  });

  describe(EMBRACE, () => {
    const embraced = () => fight([embracing], [dummy('prey', { attack: 100 })]);

    it('[SVA-SPE-1] is cast on her sixth action, once 45 energy are charged', async () => {
      const steps = await embraced();

      expect(actionsOf(steps, 'svana').indexOf(EMBRACE)).toBe(5);
    });

    it('[SVA-SPE-1] freezes its target', async () => {
      const steps = await embraced();

      expect(after(steps, { kind: 'debuff', name: EMBRACE })).toMatchObject({
        kind: 'status_change',
        status: 'freeze',
      });
    });

    it('[SVA-SPE-1] freezes its target for two turns', async () => {
      const steps = await embraced();

      expect(
        freezeTicks(
          steps,
          steps.findIndex((s) => s.name === EMBRACE),
        ),
      ).toEqual([1, 0]);
    });

    // Her freeze still holds on that hit: 63 x 2 = 126 against a frozen
    // target, x 1.6 = 201.6, then x 1.2 taken by a frozen card: 242
    it('[SVA-SPE-2] makes the next hit on its target 60% harder', async () => {
      const steps = await embraced();

      expect(
        named(
          steps.slice(steps.findIndex((s) => s.name === EMBRACE)),
          'attack',
          BREATH,
        )[0].damages[0].damage,
      ).toBe(242);
    });

    it('[SVA-SPE-2] spends the weak point on that hit', async () => {
      const steps = await embraced();

      expect(ofKind(steps, 'weak_point_ended')[0]).toMatchObject({
        name: 'Point Faible Critique',
        reason: 'struck',
      });
    });

    // A target agile enough to dodge that hit dodges the special itself
    it('[SVA-SPE-2] loses the weak point to a dodge', async () => {
      expect(swan.skills.special.effects[1].weakPoint.consumable).toBe(true);
    });

    it('[SVA-SPE-3] drains the target attack by 25% for 4 turns', async () => {
      const steps = await embraced();

      expect(named(steps, 'debuff', EMBRACE)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'attack',
          value: 25,
          remainingTurns: 4,
        }),
      ]);
    });

    it('[SVA-SPE-4] lays a hypothermia when that hit strikes the weak point', async () => {
      const steps = await embraced();

      expect(
        after(steps, { kind: 'weak_point_ended', reason: 'struck' }),
      ).toMatchObject({
        kind: 'status_change',
        status: 'hypothermia',
      });
    });

    it('[SVA-SPE-4] bites 15% of the target max health a turn, for 3 turns', async () => {
      const steps = await embraced();

      expect(
        steps
          .filter((s) => s.kind === 'state_effect' && s.type === 'hypothermia')
          .slice(0, 3)
          .map((s) => [s.damage, s.remainingTurns]),
      ).toEqual([
        [1500, 2],
        [1500, 1],
        [1500, 0],
      ]);
    });
  });

  describe(ANALYSIS, () => {
    const analysing = () => fight([swan], [dummy('prey')]);

    it('[SVA-ANA-1] lays one charge per enemy attack, up to three', async () => {
      const steps = await analysing();

      expect(
        named(steps, 'analysis_charged', ANALYSIS).map((s) => s.charges),
      ).toEqual([1, 2, 3]);
    });

    it('[SVA-ANA-2] reveals a lasting weak point with the third charge', async () => {
      const steps = await analysing();

      expect(
        after(steps, { kind: 'analysis_charged', charges: 3 }),
      ).toMatchObject({
        kind: 'weak_point_revealed',
        name: 'Point Faible',
        source: expect.objectContaining({ id: 'svana' }),
      });
    });

    // Read by the revealer alone: the engine weak point tests cover the reads
    it('[SVA-ANA-2] sharpens her accuracy by 40% and her attack by 30% against it', async () => {
      expect(skillNamed(ANALYSIS).effect.weakPoint).toMatchObject({
        revealerAccuracyRate: 0.4,
        revealerAttackRate: 0.3,
      });
    });
  });

  describe(GRACE, () => {
    it('[SVA-GRA-1] raises her agility by 15% for the whole fight', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(named(steps, 'buff', GRACE)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'agility',
          value: 9.75,
          remainingTurns: null,
        }),
      ]);
    });

    // 70% of 75 = 52.5
    it('[SVA-GRA-2] answers a dodge with Éclat de Givre, 70% air', async () => {
      const steps = await fight([focused], [dummy('clumsy', { accuracy: 0 })]);

      expect(named(steps, 'attack', COUNTER)[0].damages[0]).toMatchObject({
        defender: expect.objectContaining({ id: 'clumsy' }),
        damage: 53,
        kind: ['AIR'],
      });
    });

    it('[SVA-GRA-2] freezes the attacker on a roll under 33%', async () => {
      rolling(0.2);
      const steps = await fight([focused], [dummy('clumsy', { accuracy: 0 })]);

      expect(after(steps, { kind: 'attack', name: COUNTER })).toMatchObject({
        kind: 'status_change',
        status: 'freeze',
      });
    });

    it('[SVA-GRA-2] spares it on a roll of 33% or more', async () => {
      const steps = await fight([focused], [dummy('clumsy', { accuracy: 0 })]);

      expect(after(steps, { kind: 'attack', name: COUNTER }).kind).not.toBe(
        'status_change',
      );
    });
  });

  describe(STORM, () => {
    it('[SVA-TEM-1] strikes for 120% air', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(named(steps, 'attack', STORM)[0].damages[0]).toMatchObject({
        damage: 90,
        kind: ['AIR'],
      });
    });

    it('[SVA-TEM-2] freezes its target', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(after(steps, { kind: 'attack', name: STORM })).toMatchObject({
        kind: 'status_change',
        status: 'freeze',
      });
    });

    it('[SVA-TEM-2] freezes its target for two turns', async () => {
      const steps = await fight([focused], [dummy('prey')]);

      expect(
        freezeTicks(
          steps,
          steps.findIndex((s) => s.name === STORM),
        ),
      ).toEqual([1, 0]);
    });

    // Every Souffle Cristallin marks the target first: 90 - 100 x 0.6
    it('[SVA-TEM-3] ignores 40% of the defense of a target bearing a weak point', async () => {
      const steps = await fight([focused], [dummy('prey', { defense: 100 })]);

      expect(named(steps, 'attack', STORM)[0].damages[0].damage).toBe(30);
    });

    it('[SVA-TEM-4] comes back every fourth action', async () => {
      const steps = await fight([focused], [dummy('prey')]);
      const actions = actionsOf(steps, 'svana').slice(0, 8);

      expect(actions.flatMap((name, i) => (name === STORM ? [i] : []))).toEqual(
        [3, 7],
      );
    });
  });

  describe(WALTZ, () => {
    const analysing = () => fight([swan], [dummy('prey', { defense: 100 })]);

    it('[SVA-VAL-1] sets off once every enemy is analysed', async () => {
      const steps = await analysing();

      expect(
        after(steps, { kind: 'analysis_charged', charges: 3 }, 2),
      ).toMatchObject({
        kind: 'transformation_started',
        name: WALTZ,
        remainingTurns: 3,
      });
    });

    // 470 - 50 defense = 420 a hit: 90, under 20% of 510
    it('[SVA-VAL-1] sets off under 20% health', async () => {
      const steps = await fight([focused], [dummy('brute', { attack: 470 })]);

      expect(
        steps[steps.findIndex((s) => s.kind === 'transformation_started') - 1]
          .damages[0].remainingHealth,
      ).toBe(90);
    });

    it('[SVA-VAL-1] rises once per fight', async () => {
      const steps = await analysing();

      expect(ofKind(steps, 'transformation_started')).toHaveLength(1);
    });

    it('[SVA-VAL-2] sharpens her accuracy by 50% and her speed by 35% for 3 turns', async () => {
      const steps = await analysing();

      expect(named(steps, 'buff', WALTZ)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'accuracy',
          value: 40,
          remainingTurns: 3,
        }),
        expect.objectContaining({
          kind: 'speed',
          value: 24.5,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[SVA-VAL-2] raises her critical damage by 30%', async () => {
      expect(skillNamed(WALTZ).criticalDamageRate).toBe(0.3);
    });

    it('[SVA-VAL-3] freezes every enemy as it starts', async () => {
      const steps = await analysing();

      expect(
        after(steps, { kind: 'stance_started', name: 'valse-du-cygne-noir' }),
      ).toMatchObject({
        kind: 'status_change',
        status: 'freeze',
        card: expect.objectContaining({ id: 'prey' }),
      });
    });

    it('[SVA-VAL-3] weakens the defense of every enemy by 25% for 3 turns', async () => {
      const steps = await analysing();

      expect(named(steps, 'debuff', MASS_FREEZE)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'defense',
          value: 25,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[SVA-VAL-4] reveals a weak point on every enemy for 3 turns', async () => {
      const steps = await analysing();

      expect(
        named(steps, 'weak_point_revealed', 'Omniscience Tactique'),
      ).toEqual([
        expect.objectContaining({
          card: expect.objectContaining({ id: 'prey' }),
          remainingTurns: 3,
        }),
      ]);
    });

    it('[SVA-VAL-4] hits each of them 15% harder', async () => {
      expect(skillNamed(OMNISCIENCE).effect.weakPoint.revealerDamageRate).toBe(
        0.15,
      );
    });

    it('[SVA-VAL-5] shatters crystals of air on the neighbors of her target', async () => {
      const steps = await fight(
        [swan],
        [unfreezable('left'), unfreezable('right')],
      );

      expect(named(steps, 'attack', CRYSTALS)[0].damages).toEqual([
        expect.objectContaining({
          defender: expect.objectContaining({ id: 'right' }),
          kind: ['AIR'],
        }),
      ]);
    });

    it('[SVA-VAL-5] strikes the neighbors for 60% of her attack', async () => {
      expect(skillNamed(CRYSTALS).damages).toEqual([
        { type: 'AIR', rate: 0.6 },
      ]);
    });

    it('[SVA-VAL-6] leaves the weak points she revealed for good when she dies in it', async () => {
      const steps = await fight([focused], [dummy('brute', { attack: 470 })]);

      expect(
        after(steps, { kind: 'status_change', status: 'dead' }),
      ).toMatchObject({
        kind: 'weak_point_revealed',
        name: 'Omniscience Tactique',
        card: expect.objectContaining({ id: 'brute' }),
      });
    });

    it('[SVA-VAL-6] keeps them without a duration', async () => {
      const steps = await fight([focused], [dummy('brute', { attack: 470 })]);

      expect(
        after(steps, { kind: 'status_change', status: 'dead' })
          .remainingTurns ?? null,
      ).toBeNull();
    });

    it('[SVA-VAL-6] makes them hit 25% harder', async () => {
      expect(skillNamed(SWAN_LEGACY).rate).toBe(0.25);
    });
  });
});
