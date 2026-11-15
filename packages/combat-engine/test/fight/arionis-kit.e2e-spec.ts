import { jest } from '@jest/globals';
import {
  actionsOf,
  dummy,
  named,
  ofKind,
  rosterCard,
  useFight,
} from '../helpers/kit';

const FISTS = 'Poings de Braise';
const ROAR = 'Rugissement solaire';
const PRIDE = 'Fierté du lion';
const CLAWS = 'Griffes ardentes';
const BLAST = 'Explosion massive';
const HEROIC_BUFF = 'Buff Héroïque';
const VENGEANCE = 'Vengeance';
const VENGEANCE_END = 'Fin de la vengeance';

const arionis = rosterCard('arionis');

// Kaelion as far as Arionis can tell: his ally-presence condition reads the name
const kaelion = (overrides = {}) =>
  dummy('kaelion', { name: 'Kaelion', ...overrides });

const burnTicksOn = (steps: any[], id: string) =>
  steps.filter(
    (s) => s.kind === 'state_effect' && s.type === 'burn' && s.card.id === id,
  );

describe('Arionis full kit', () => {
  const fight = useFight();

  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  const alone = () => fight([arionis], [dummy('foe', { attack: 10 })]);
  const inspiring = (ally: object) =>
    fight([arionis, ally], [dummy('foe', { attack: 10 })]);

  describe(FISTS, () => {
    // 68 physical + 34 fire
    it('[ARI-ATK-1] strikes for 80% physical and 40% fire', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', FISTS)[0].damages[0]).toMatchObject({
        damage: 102,
        kind: ['PHYSICAL', 'FIRE'],
      });
    });

    it('[ARI-ATK-2] burns its target for 10% of his attack a turn', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(burnTicksOn(steps, 'foe')[0].damage).toBe(8.5);
    });

    // A level 1 burn ticks once
    it('[ARI-ATK-3] lays a light burn, level 1', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(burnTicksOn(steps, 'foe')[0].remainingTurns).toBe(0);
    });
  });

  describe(ROAR, () => {
    it('[ARI-SPE-1] is cast on his fifth action, once 40 energy are charged', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(actionsOf(steps, 'arionis').indexOf(ROAR)).toBe(4);
    });

    // 4 turns of Fierté du lion: 85 + 4 x 4.25 = 102 attack, x 1.5
    it('[ARI-SPE-1] strikes every enemy for 150% of his attack', async () => {
      rolling(0.99);
      const steps = await fight([arionis], [dummy('a'), dummy('b')]);

      expect(
        named(steps, 'special_attack', ROAR)[0].damages.map((d) => d.damage),
      ).toEqual([153, 153]);
    });

    // b, never struck by his fists, is not burning yet: 30% of 102
    it('[ARI-SPE-2] burns for 30% of his attack a turn', async () => {
      rolling(0.99);
      const steps = await fight([arionis], [dummy('a'), dummy('b')]);

      expect(burnTicksOn(steps, 'b')[0].damage).toBe(30.6);
    });

    it('[ARI-SPE-5] deals fire damage', async () => {
      rolling(0.99);
      const steps = await fight([arionis], [dummy('a'), dummy('b')]);

      expect(named(steps, 'special_attack', ROAR)[0].damages[0].kind).toEqual([
        'FIRE',
      ]);
    });

    // A level 3 burn ticks five times
    it('[ARI-SPE-6] lays a severe burn, level 3', async () => {
      rolling(0.99);
      const steps = await fight([arionis], [dummy('a'), dummy('b')]);

      expect(burnTicksOn(steps, 'b')[0].remainingTurns).toBe(4);
    });

    it('[ARI-SPE-3] raises the attack and defense of his allies by 5% for a turn', async () => {
      rolling(0.99);
      const steps = await inspiring(
        dummy('ally', { attack: 100, defense: 100 }),
      );

      expect(named(steps, 'buff', ROAR)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'attack',
          value: 5,
          remainingTurns: 1,
        }),
        expect.objectContaining({
          kind: 'defense',
          value: 5,
          remainingTurns: 1,
        }),
      ]);
    });

    it('[ARI-SPE-4] doubles the support when Kaelion stands with him', async () => {
      rolling(0.99);
      const steps = await inspiring(kaelion({ attack: 100, defense: 100 }));

      expect(
        named(steps, 'buff', ROAR)[0].alterations.map((a) => a.value),
      ).toEqual([10, 10]);
    });
  });

  describe('Chaleur étouffante', () => {
    const tough = () => fight([arionis], [dummy('foe', { defense: 50 })]);

    it('[ARI-CHA-1] weakens the defense of a burned enemy by 8% on a roll under 30%', async () => {
      rolling(0.1);
      const steps = await tough();

      expect(ofKind(steps, 'debuff')[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'defense',
          value: 4,
          remainingTurns: 2,
        }),
      ]);
    });

    it('[ARI-CHA-1] spares it on a roll of 30% or more', async () => {
      rolling(0.99);
      const steps = await tough();

      expect(ofKind(steps, 'debuff')).toEqual([]);
    });
  });

  describe(PRIDE, () => {
    it('[ARI-FIE-1] raises his attack by 5% at each turn end, for good', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(
        named(steps, 'buff', PRIDE)
          .slice(0, 3)
          .map((s) => s.alterations[0]),
      ).toEqual(
        Array(3).fill(
          expect.objectContaining({
            kind: 'attack',
            value: 4.25,
            remainingTurns: null,
          }),
        ),
      );
    });

    // 200 - 60 defense = 140 a hit: 410, then 270, under half of 550
    it('[ARI-FIE-1] stops once he falls to half his health', async () => {
      rolling(0.99);
      const steps = await fight([arionis], [dummy('foe', { attack: 200 })]);
      const halved = steps.findIndex(
        (s) =>
          s.kind === 'attack' &&
          s.damages[0].defender.id === 'arionis' &&
          s.damages[0].remainingHealth < 275,
      );

      expect(named(steps.slice(halved), 'buff', PRIDE)).toEqual([]);
    });
  });

  describe(CLAWS, () => {
    // 40% of (85 + 2 x 4.25) = 37.4 -> 37
    it('[ARI-GRI-1] strikes four times for 40% physical', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(
        named(steps, 'attack', CLAWS)[0]
          .damages.slice(0, 4)
          .map((d) => d.damage),
      ).toEqual([37, 37, 37, 37]);
    });

    // 80% of 93.5 = 74.8 -> 75
    it('[ARI-GRI-2] finishes with 80% fire', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', CLAWS)[0].damages[4]).toMatchObject({
        damage: 75,
        kind: ['FIRE'],
      });
    });

    // His special counts as an action
    it('[ARI-GRI-3] replaces his attack every third action', async () => {
      rolling(0.99);
      const steps = await alone();
      const actions = actionsOf(steps, 'arionis').slice(0, 9);

      expect(actions.flatMap((name, i) => (name === CLAWS ? [i] : []))).toEqual(
        [2, 5, 8],
      );
    });
  });

  describe('Héritage du Lion', () => {
    // killer takes Kaelion down at once, then Arionis hunts it down
    const avenging = (otherAttack = 10) =>
      fight(
        [arionis, kaelion({ health: 100 })],
        [
          dummy('other', { attack: otherAttack }),
          dummy('killer', { attack: 500, health: 400 }),
        ],
      );
    const kaelionDeath = (steps: any[]) =>
      steps.findIndex(
        (s) =>
          s.kind === 'status_change' &&
          s.status === 'dead' &&
          s.card.id === 'kaelion',
      );

    // 85 + 4.25 attack: 89.25 -> 89
    it('[ARI-HER-1] blasts every enemy for 100% fire when Kaelion falls', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(steps[kaelionDeath(steps) + 1]).toMatchObject({
        name: BLAST,
        damages: [
          expect.objectContaining({ damage: 89, kind: ['FIRE'] }),
          expect.objectContaining({ damage: 89, kind: ['FIRE'] }),
        ],
      });
    });

    it('[ARI-HER-1] burns every enemy', async () => {
      rolling(0.99);
      const steps = await avenging();
      const blast = kaelionDeath(steps) + 1;

      expect(
        steps.slice(blast + 1, blast + 3).map((s) => [s.card.id, s.status]),
      ).toEqual([
        ['other', 'burn'],
        ['killer', 'burn'],
      ]);
    });

    it('[ARI-HER-2] raises his attack by 40% while it lasts', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(named(steps, 'buff', HEROIC_BUFF)[0].alterations[0]).toMatchObject(
        {
          kind: 'attack',
          value: 34,
        },
      );
    });

    it('[ARI-HER-3] turns him on the one who killed Kaelion', async () => {
      rolling(0.99);
      const steps = await avenging();
      const vengeance = steps.findIndex((s) => s.name === VENGEANCE);

      expect(
        steps
          .slice(vengeance)
          .find((s) => s.kind === 'attack' && s.attacker.id === 'arionis')
          .damages[0].defender.id,
      ).toBe('killer');
    });

    it('[ARI-HER-4] ends once the killer falls: the buff goes', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(ofKind(steps, 'buff_removed')[0].removed).toEqual([
        expect.objectContaining({ kind: 'attack', value: 34 }),
      ]);
    });

    it('[ARI-HER-4] ends once the killer falls: the burns go', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(
        ofKind(steps, 'effect_removed')[0].removed.map((r) => r.effectType),
      ).toContain('burn');
    });

    it('[ARI-HER-4] ends once the killer falls: his targeting comes back', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(ofKind(steps, 'targeting_reverted')[0].eventName).toBe(
        'lion-heritage-end',
      );
    });

    it('[ARI-HER-4] ends right after the killer falls', async () => {
      rolling(0.99);
      const steps = await avenging();
      const killed = steps.findIndex(
        (s) =>
          s.kind === 'status_change' &&
          s.status === 'dead' &&
          s.card.id === 'killer',
      );

      expect(steps[killed + 1].name).toBe(VENGEANCE_END);
    });

    // other hits for 200 so that he has health to win back: 33% of 550
    it('[ARI-HER-5] heals him for 33% of his max health once the killer falls', async () => {
      rolling(0.99);
      const steps = await avenging(260);

      expect(named(steps, 'healing', VENGEANCE_END)[0].heal[0].healed).toBe(
        181.5,
      );
    });
  });
});
