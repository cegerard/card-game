import {
  actionsOf,
  alteration,
  alterationsOf,
  deathOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const LACERATION = 'Lacération Silencieuse';
const FUSION = 'Fusion Tectonique';
const GHOST_WALK = 'Marche Fantôme';
const CLAWS = 'Griffures';
const INSTINCT = 'Instinct de Chasseresse';
const INSTINCT_SPEED = 'Instinct de Chasseresse - Vitesse';
const AMBUSH = 'Embuscade Tectonique';
const SURPRISE_ATTACK = 'Embuscade Tectonique - Attaque surprise';
const JUDGEMENT = 'Jugement de l’Obsidienne';
const PANTHER_LEGACY = 'Héritage de la Panthère';

// Nothing in her kit rolls: without criticals her fights replay exactly
const selkhet = rosterCard('selkhet');

const after = (steps: any[], match: (s: any) => boolean) =>
  steps.slice(steps.findIndex(match) + 1);
const dives = (steps: any[]) =>
  steps.filter((s) => s.kind === 'stance_started' && s.name === 'sous-terre');

/** Strikes the whole board, so Selkhet takes a hit as soon as she shows. */
const brute = dummy('brute', {
  attack: 135,
  agility: 20,
  speed: 10,
  skills: {
    ...dummy('brute').skills,
    simpleAttack: {
      name: 'Smash',
      damages: [{ type: 'PHYSICAL', rate: 1 }],
      targetingStrategy: 'target-all',
    },
  },
});

describe('Selkhet full kit', () => {
  const fight = useFight();

  // A harmless prey: she dives and strikes at will, and it falls under 40%
  const hunting = () =>
    fight([selkhet], [dummy('prey', { health: 5000, regeneration: 10 })]);

  // The weakling dies at her second blow; the brute takes her under 40%;
  // the straggler is left at 22% by the ultimate
  const cornered = () =>
    fight(
      [
        selkhet,
        dummy('slow-ally', { speed: 20 }),
        dummy('fast-ally', { speed: 200 }),
      ],
      [
        dummy('weakling', { health: 160, speed: 10 }),
        brute,
        dummy('straggler', { health: 330, speed: 10, agility: 20 }),
      ],
    );

  describe(LACERATION, () => {
    // In the open: 60 physical + 36 earth
    it('[SEL-ATK-1] strikes for 75% physical and 45% earth', async () => {
      const steps = await hunting();

      expect(named(steps, 'attack', LACERATION)[1].damages[0]).toMatchObject({
        damage: 96,
        kind: ['PHYSICAL', 'EARTH'],
      });
    });

    it('[SEL-ATK-2] bleeds 2% of the target max health a turn, for 3 turns', async () => {
      const steps = await hunting();

      expect(
        steps.find((s) => s.kind === 'state_effect' && s.type === 'bleed'),
      ).toMatchObject({ damage: 100, remainingStacks: 1, remainingTurns: 2 });
    });

    // 60 x 1.5 = 90 physical + 36 earth
    it('[SEL-ATK-3] strikes 50% harder in physical from concealment', async () => {
      const steps = await hunting();

      expect(named(steps, 'attack', LACERATION)[0].damages[0].damage).toBe(126);
    });
  });

  describe(FUSION, () => {
    it('[SEL-SPE-1] is cast once 80 energy are charged', async () => {
      const steps = await hunting();
      const fusion = steps.findIndex((s) => s.name === FUSION);
      const last = steps
        .slice(0, fusion)
        .filter((s) => s.kind === 'attack' && s.attacker.id === 'selkhet')
        .slice(-1)[0];

      expect(last.energy).toBe(80);
    });

    it('[SEL-SPE-1] hides her from her enemies for 2 turns', async () => {
      const steps = await hunting();

      expect(
        named(steps, 'concealment_started', FUSION)[0].remainingTurns,
      ).toBe(2);
    });

    it('[SEL-SPE-2] sharpens her accuracy by 30% for 2 turns', async () => {
      const steps = await hunting();

      expect(alterationsOf(steps, 'buff', FUSION)).toEqual([
        alteration('accuracy', 25.5, 2),
      ]);
    });

    it('[SEL-SPE-2] lets her see through concealment while it lasts', async () => {
      const stance = selkhet.skills.special.stanceActivation;

      expect(stance).toMatchObject({
        name: 'fusion-tectonique',
        revealsConcealed: true,
      });
    });

    it('[SEL-SPE-3] makes her bleeds cut the regeneration by 50% for 4 turns', async () => {
      const steps = await hunting();

      const cut = ofKind(
        after(steps, (s) => s.name === FUSION),
        'debuff',
      ).find((s) => s.alterations[0].kind === 'regeneration');

      expect(cut.alterations).toEqual([alteration('regeneration', 5, 4)]);
    });

    it('[SEL-SPE-3] makes her bleeds deal 3% of the max health for 4 turns', async () => {
      const claws = selkhet.skills.others.find((s) => s.name === CLAWS);

      expect(claws).toMatchObject({ rate: 0.03, duration: 4 });
    });
  });

  describe(GHOST_WALK, () => {
    it('[SEL-MAR-1] opens the fight concealed', async () => {
      const steps = await hunting();

      expect(steps[1]).toMatchObject({
        kind: 'concealment_started',
        name: GHOST_WALK,
      });
    });

    it('[SEL-MAR-1] shows herself at her first attack', async () => {
      const steps = await hunting();

      expect(steps[3]).toMatchObject({
        kind: 'concealment_ended',
        name: GHOST_WALK,
        reason: 'attacked',
      });
    });

    it('[SEL-MAR-2] hides again for a turn after a kill', async () => {
      const steps = await cornered();

      expect(steps[deathOf(steps, 'weakling') + 1]).toMatchObject({
        kind: 'concealment_started',
        name: GHOST_WALK,
        remainingTurns: 1,
      });
    });
  });

  describe(INSTINCT, () => {
    // The first Lacération on a prey already under 40% (2000) before the hit,
    // stunned by the surprise attack (+20% taken): 96 x 1.25 x 1.2
    it('[SEL-INS-1] hits a target under 40% health 25% harder', async () => {
      const steps = await hunting();
      const weakened = named(steps, 'attack', LACERATION).find(
        (s) => s.damages[0].remainingHealth + s.damages[0].damage < 2000,
      );

      expect(weakened.damages[0].damage).toBe(144);
    });

    it('[SEL-INS-2] quickens her by 15% for good when she kills under 30%', async () => {
      const steps = await cornered();

      expect(alterationsOf(steps, 'buff', INSTINCT_SPEED)).toEqual([
        alteration('speed', 13.8, null),
      ]);
    });

    // Four weaklings, each killed from 21%
    it('[SEL-INS-2] quickens her three times at most', async () => {
      const steps = await fight(
        [selkhet],
        ['w1', 'w2', 'w3', 'w4'].map((id) => dummy(id, { health: 160 })),
      );

      expect(named(steps, 'buff', INSTINCT_SPEED)).toHaveLength(3);
    });
  });

  describe(AMBUSH, () => {
    it('[SEL-EMB-1] sinks underground on her fourth action', async () => {
      const steps = await hunting();
      const sunk = steps.findIndex((s) => s.name === 'sous-terre');

      expect(named(steps.slice(0, sunk), 'attack', LACERATION)).toHaveLength(3);
    });

    it('[SEL-EMB-1] cannot be struck while underground', async () => {
      const steps = await hunting();

      expect(named(steps, 'concealment_started', AMBUSH)).not.toEqual([]);
    });

    it('[SEL-EMB-1] surfaces to strike at her next turn start', async () => {
      const steps = await hunting();
      const sunk = steps.findIndex((s) => s.name === 'sous-terre');

      expect(
        steps
          .slice(sunk)
          .find((s) => s.kind === 'attack' && s.attacker.id === 'selkhet').name,
      ).toBe(SURPRISE_ATTACK);
    });

    // 120 physical + 64 earth
    it('[SEL-EMB-2] strikes for 150% physical and 80% earth', async () => {
      const steps = await hunting();

      expect(
        named(steps, 'attack', SURPRISE_ATTACK)[0].damages[0],
      ).toMatchObject({
        damage: 184,
        kind: ['PHYSICAL', 'EARTH'],
      });
    });

    it('[SEL-EMB-3] stuns its target', async () => {
      const steps = await hunting();

      const struck = after(steps, (s) => s.name === SURPRISE_ATTACK);
      const status = ofKind(struck, 'status_change')[0];

      expect([status.card.id, status.status]).toEqual(['prey', 'stunt']);
    });

    it('[SEL-EMB-4] fractures the target defense by 30% for 2 turns', async () => {
      const prey = dummy('prey', { health: 5000, defense: 20 });
      const steps = await fight([selkhet], [prey]);

      expect(alterationsOf(steps, 'debuff', SURPRISE_ATTACK)).toEqual([
        alteration('defense', 6, 2),
      ]);
    });

    // 40 attack against 35 defense: a 5 point scratch every turn she shows
    it('[SEL-EMB-5] stays above ground while she keeps taking hits', async () => {
      const steps = await fight(
        [selkhet],
        [dummy('prey', { health: 5000, attack: 40 })],
      );
      const fusion = steps.findIndex((s) => s.name === FUSION);

      expect(dives(steps.slice(0, fusion))).toEqual([]);
    });

    // Lacérations at her 5th (after the strike), 6th and 7th turns
    it('[SEL-EMB-6] sinks again four turns later', async () => {
      const steps = await hunting();
      const [first, second] = dives(steps).map((s) => steps.indexOf(s));
      const underground = steps.slice(first, second);

      expect(actionsOf(underground, 'selkhet')).toEqual([
        SURPRISE_ATTACK,
        ...Array(3).fill(LACERATION),
      ]);
    });
  });

  describe(JUDGEMENT, () => {
    // 160 physical + 96 earth on each
    it('[SEL-JUG-1] strikes every enemy for 200% physical and 120% earth', async () => {
      const steps = await cornered();

      const { damages } = named(steps, 'attack', JUDGEMENT)[0];

      expect(damages.map((d) => [d.defender.id, d.damage])).toEqual([
        ['brute', 256],
        ['straggler', 256],
      ]);
    });

    it('[SEL-JUG-2] executes the enemy left under 25%', async () => {
      const steps = await cornered();

      expect(named(steps, 'executed', JUDGEMENT)[0].card.id).toBe('straggler');
    });

    it('[SEL-JUG-3] lowers the dodge of the survivors by 50% for 3 turns', async () => {
      const steps = await cornered();

      expect(alterationsOf(steps, 'debuff', JUDGEMENT)).toEqual([
        alteration('agility', 10, 3, 'brute'),
      ]);
    });

    it('[SEL-JUG-4] opens a 3 turn window for her legacy', async () => {
      const steps = await cornered();

      expect(
        ofKind(steps, 'stance_started').find(
          (s) => s.name === 'heritage-de-la-panthere',
        ).remainingTurns,
      ).toBe(3);
    });

    // Her two Instinct speed buffs, handed over as they were
    const LEGACY = [
      'buff_transferred',
      PANTHER_LEGACY,
      'fast-ally',
      ...Array(2).fill(alteration('speed', 13.8)),
    ];

    it('[SEL-JUG-4] hands her speed buffs to the fastest ally when she falls', async () => {
      const steps = await cornered();
      const { kind, name, target, alterations } =
        steps[deathOf(steps, 'selkhet') + 1];

      expect([kind, name, target.id, ...alterations]).toEqual(LEGACY);
    });

    it('[SEL-JUG-5] fires once per fight', async () => {
      const steps = await cornered();

      expect(named(steps, 'attack', JUDGEMENT)).toHaveLength(1);
    });
  });
});
