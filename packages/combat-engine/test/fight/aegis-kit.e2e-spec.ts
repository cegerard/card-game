import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  hitsOn,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const FIST = 'Poing de Limon';
const FORTRESS = 'Forteresse des Âges';
const COUNTER = 'Contre-attaque défensive';
const RESILIENCE = 'Résilience des marais';
const RESILIENCE_MIRE = 'Résilience des marais - Enlisement';
const ENDURANCE = 'Endurance séculaire';
const SECOND_WIND = 'Endurance séculaire - Second souffle';
const WAVES = 'Vagues de Pierre';
const GUARDIAN = 'Gardien Éternel';
const ANCESTRAL_SHELL = 'Gardien Éternel - Carapace ancestrale';
const TURTLE_BREATH = 'Gardien Éternel - Souffle de la tortue';
const SHARED_REGENERATION = 'Gardien Éternel - Régénération partagée';
const SACRIFICE = 'Gardien Éternel - Sacrifice';
const BROKEN_SHELL = 'Gardien Éternel - La carapace brisée';

const aegis = rosterCard('aegis');

// Speed debuffs landed on a card: Enlisement is the only one in these fights
const mireOn = (steps: any[], id: string) =>
  ofKind(steps, 'debuff').filter((s) =>
    s.alterations.some((a) => a.target.id === id && a.kind === 'speed'),
  );

// Poing de Limon lays it before the first Vagues de Pierre, unnamed
const fistMire = (steps: any[]) =>
  mireOn(
    steps.slice(
      0,
      steps.findIndex((s) => s.name === WAVES),
    ),
    'foe',
  ).filter((s) => !s.name);

const between = (steps: any[], from: string, to: string) =>
  steps.slice(
    steps.findIndex((s) => s.kind === from),
    steps.findIndex((s) => s.kind === to),
  );

describe('Aegis full kit', () => {
  const fight = useFight();

  // High rolls: no Enlisement, no mitigation, unless a test says otherwise
  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  const alone = () => fight([aegis], [dummy('foe', { attack: 100 })]);

  describe(FIST, () => {
    // 55 attack: 38.5 physical -> 39, 9.625 earth -> 10, 9.625 water -> 10
    it('[AEG-ATK-1] strikes for 70% physical and 35% earth and water', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', FIST)[0].damages[0]).toMatchObject({
        damage: 59,
        kind: ['PHYSICAL', 'EARTH', 'WATER'],
      });
    });

    it('[AEG-ATK-2] mires its target on a roll under 25%: speed -10% for 3 turns', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(fistMire(steps)[0].alterations[0]).toMatchObject({
        value: 5,
        remainingTurns: 3,
      });
    });

    it('[AEG-ATK-2] does not mire on a roll of 25% or more', async () => {
      rolling(0.26);
      const steps = await alone();

      expect(fistMire(steps)).toEqual([]);
    });

    it('[AEG-ATK-2] stacks Enlisement three times at most', async () => {
      rolling(0.2);
      const steps = await alone();
      const firstExpiry = steps.findIndex(
        (s) => s.kind === 'debuff_expired' && s.card.id === 'foe',
      );

      expect(mireOn(steps.slice(0, firstExpiry), 'foe')).toHaveLength(3);
    });
  });

  describe(FORTRESS, () => {
    it('[AEG-SPE-1] is cast on his fifth action, once 40 energy are charged', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(actionsOf(steps, 'aegis').indexOf(FORTRESS)).toBe(4);
    });

    it('[AEG-SPE-1] shields him and his allies for half their max health', async () => {
      rolling(0.99);
      const steps = await fight(
        [aegis, dummy('ally', { health: 1000 })],
        [dummy('foe')],
      );

      expect(named(steps, 'shield_applied', FORTRESS)[0].targets).toEqual([
        expect.objectContaining({
          target: expect.objectContaining({ id: 'aegis' }),
          points: 325,
        }),
        expect.objectContaining({
          target: expect.objectContaining({ id: 'ally' }),
          points: 500,
        }),
      ]);
    });

    it('[AEG-SPE-1] holds the stance for three turns', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(ofKind(steps, 'stance_started')[0].remainingTurns).toBe(3);
    });

    // 13.75 earth -> 14, 13.75 water -> 14
    it('[AEG-SPE-2] strikes back for 50% earth and water at each hit taken', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', COUNTER)[0].damages[0]).toMatchObject({
        defender: expect.objectContaining({ id: 'foe' }),
        damage: 28,
        kind: ['EARTH', 'WATER'],
      });
    });

    it('[AEG-SPE-2] strikes back only while the fortress stands', async () => {
      rolling(0.99);
      const steps = await alone();
      const counters = steps
        .map((s, i) => (s.name === COUNTER ? i : -1))
        .filter((i) => i >= 0);
      const opened = steps.findIndex((s) => s.kind === 'stance_started');

      expect(counters.every((i) => i > opened)).toBe(true);
    });

    it('[AEG-SPE-2] stops striking back once the fortress falls', async () => {
      rolling(0.99);
      const steps = await alone();
      const closed = steps.findIndex((s) => s.kind === 'stance_ended');
      const reopened = steps.findIndex(
        (s, i) => i > closed && s.kind === 'stance_started',
      );

      expect(
        named(
          steps.slice(closed, reopened === -1 ? undefined : reopened),
          'attack',
          COUNTER,
        ),
      ).toEqual([]);
    });

    it('[AEG-SPE-3] shrugs off stuns while the fortress stands', async () => {
      rolling(0.99);
      const stunner = dummy('foe', { attack: 10 });
      stunner.skills.simpleAttack.effects = [
        { type: 'STUNT', rate: 0, level: 1 },
      ];
      const steps = await fight([aegis], [stunner]);

      expect(
        between(steps, 'stance_started', 'stance_ended').filter(
          (s) =>
            s.kind === 'status_change' &&
            s.status === 'stunt' &&
            s.card.id === 'aegis',
        ),
      ).toEqual([]);
    });
  });

  describe(RESILIENCE, () => {
    it('[AEG-RES-1] cuts a hit by 15% on a roll under 30%', async () => {
      rolling(0.2);
      const steps = await alone();

      // 100 - 85 defense = 15, less 15% -> 12.75 -> 13
      expect(hitsOn(steps, 'aegis')[0].damage).toBe(13);
    });

    it('[AEG-RES-1] reports the cut', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(named(steps, 'damage_mitigated', RESILIENCE)).not.toEqual([]);
    });

    it('[AEG-RES-1] takes the hit whole on a roll of 30% or more', async () => {
      rolling(0.31);
      const steps = await alone();

      expect(hitsOn(steps, 'aegis')[0].damage).toBe(15);
    });

    it('[AEG-RES-2] mires the attacker on a roll under 30%', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(
        named(steps, 'debuff', RESILIENCE_MIRE)[0].alterations[0],
      ).toMatchObject({
        target: expect.objectContaining({ id: 'foe' }),
        kind: 'speed',
        value: 5,
        remainingTurns: 3,
      });
    });
  });

  describe(ENDURANCE, () => {
    it('[AEG-END-1] hardens his defense by 10% above 30% health', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'buff', ENDURANCE)[0].alterations[0]).toMatchObject({
        kind: 'defense',
        value: 8.5,
      });
    });

    it('[AEG-END-2] regenerates 15% more under 30% health instead', async () => {
      rolling(0.99);
      const steps = await fight([aegis], [dummy('foe', { attack: 400 })]);

      expect(named(steps, 'buff', SECOND_WIND)[0].alterations[0]).toMatchObject(
        {
          kind: 'regeneration',
          value: 8.25,
        },
      );
    });

    it('[AEG-END-2] stops hardening his defense under 30% health', async () => {
      rolling(0.99);
      const steps = await fight([aegis], [dummy('foe', { attack: 400 })]);
      const secondWind = steps.findIndex((s) => s.name === SECOND_WIND);

      expect(named(steps.slice(secondWind), 'buff', ENDURANCE)).toEqual([]);
    });
  });

  describe(WAVES, () => {
    // 45% of 55 = 24.75 -> 25 a wave
    it('[AEG-VAG-1] strikes three waves of 45% physical', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(
        named(steps, 'attack', WAVES)[0]
          .damages.slice(0, 3)
          .map((d) => d.damage),
      ).toEqual([25, 25, 25]);
    });

    // 30% of 55 = 16.5 -> 17 earth, 17 water
    it('[AEG-VAG-3] finishes an enemy struck by all three waves with 60% earth and water', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', WAVES)[0].damages[3]).toMatchObject({
        damage: 34,
        kind: ['EARTH', 'WATER'],
      });
    });

    it('[AEG-VAG-1] strikes every enemy', async () => {
      rolling(0.99);
      const steps = await fight([aegis], [dummy('a'), dummy('b')]);

      expect(
        named(steps, 'attack', WAVES)[0].damages.map((d) => d.defender.id),
      ).toEqual(['a', 'b', 'a', 'b', 'a', 'b', 'a', 'b']);
    });

    it('[AEG-VAG-2] mires each enemy once per wave', async () => {
      rolling(0.99);
      const steps = await alone();
      const waves = steps.findIndex((s) => s.name === WAVES);

      expect(mireOn(steps.slice(waves, waves + 7), 'foe')).toHaveLength(3);
    });

    it('[AEG-VAG-3] stuns an enemy struck by all three waves', async () => {
      rolling(0.99);
      const steps = await alone();
      const waves = steps.findIndex((s) => s.name === WAVES);

      expect(
        steps.slice(waves).find((s) => s.kind === 'status_change'),
      ).toMatchObject({
        card: expect.objectContaining({ id: 'foe' }),
        status: 'stunt',
      });
    });

    // His special counts as an action, his reactive strikes back do not
    it('[AEG-VAG-4] replaces his attack every fourth action', async () => {
      rolling(0.99);
      const steps = await alone();
      const actions = actionsOf(steps, 'aegis')
        .filter((name) => name !== COUNTER)
        .slice(0, 8);

      expect(actions.flatMap((name, i) => (name === WAVES ? [i] : []))).toEqual(
        [3, 7],
      );
    });
  });

  describe(GUARDIAN, () => {
    // foe2 takes the ally from 1000 to 100, under 20%, in three hits
    const guarding = () =>
      fight(
        [aegis, dummy('ally', { health: 1000 })],
        [dummy('foe1', { attack: 10 }), dummy('foe2', { attack: 300 })],
      );

    it('[AEG-GAR-1] stands before the ally falling under 20% health', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(named(steps, 'protection_started', GUARDIAN)[0]).toMatchObject({
        protectedCard: expect.objectContaining({ id: 'ally' }),
        remainingTurns: 2,
      });
    });

    it('[AEG-GAR-1] takes the attacks aimed at it', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(ofKind(steps, 'attack_intercepted')[0]).toMatchObject({
        card: expect.objectContaining({ id: 'aegis' }),
        protectedCard: expect.objectContaining({ id: 'ally' }),
      });
    });

    it('[AEG-GAR-1] rises once per fight', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(ofKind(steps, 'protection_started')).toHaveLength(1);
    });

    it('[AEG-GAR-2] hardens his defense by 50% for two turns', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(
        named(steps, 'buff', ANCESTRAL_SHELL)[0].alterations[0],
      ).toMatchObject({
        kind: 'defense',
        value: 42.5,
        remainingTurns: 2,
      });
    });

    it('[AEG-GAR-2] regenerates 30% more for two turns', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(
        named(steps, 'buff', TURTLE_BREATH)[0].alterations[0],
      ).toMatchObject({
        kind: 'regeneration',
        value: 16.5,
        remainingTurns: 2,
      });
    });

    it('[AEG-GAR-3] heals the ally 10% of its max health a turn', async () => {
      rolling(0.99);
      const steps = await guarding();

      expect(
        named(steps, 'healing', SHARED_REGENERATION)[0].heal[0],
      ).toMatchObject({
        target: expect.objectContaining({ id: 'ally' }),
        healed: 100,
      });
    });

    it('[AEG-GAR-3] stops healing once the protection ends', async () => {
      rolling(0.99);
      const steps = await guarding();
      const ended = steps.findIndex((s) => s.kind === 'protection_ended');

      expect(named(steps.slice(ended), 'healing', SHARED_REGENERATION)).toEqual(
        [],
      );
    });

    describe('when he falls guarding', () => {
      // 400 health: the first blow foe2 aims at the ally kills him
      const sacrificed = () =>
        fight(
          [
            rosterCard('aegis', { health: 400 }),
            dummy('ally', { health: 1200, defense: 100 }),
          ],
          [dummy('foe1', { attack: 10 }), dummy('foe2', { attack: 600 })],
        );

      it('[AEG-GAR-4] heals the ally 40% of its max health', async () => {
        rolling(0.99);
        const steps = await sacrificed();

        expect(named(steps, 'healing', SACRIFICE)[0].heal[0]).toMatchObject({
          target: expect.objectContaining({ id: 'ally' }),
          healed: 480,
        });
      });

      it('[AEG-GAR-4] hardens the ally defense by 20% for the rest of the fight', async () => {
        rolling(0.99);
        const steps = await sacrificed();

        expect(named(steps, 'buff', BROKEN_SHELL)[0].alterations).toEqual([
          expect.objectContaining({
            target: expect.objectContaining({ id: 'ally' }),
            kind: 'defense',
            value: 20,
            remainingTurns: null,
          }),
        ]);
      });
    });
  });
});
