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

const FLAME = 'Flamme Terreuse';
const BASALT_HEART = 'Coeur de basalte';
const RUSH = 'Elan de la salamandre';
const RESILIENCE = 'Résilience Pyro-Minérale';
const RESILIENCE_ATTACK = 'Résilience Pyro-Minérale - ATTACK';
const RECHARGE = 'Recharge naturelle';
const RECHARGE_DEFENSE = 'Recharge naturelle - DEFENSE';
const RECHARGE_ATTACK = 'Recharge naturelle - ATTACK';
const TEARS = 'Larmes de la salamandre';

const kaelion = rosterCard('kaelion');

const statusesOn = (steps: any[], id: string, status: string) =>
  ofKind(steps, 'status_change').filter(
    (s) => s.card.id === id && s.status === status,
  );

const after = (steps: any[], found: (step: any) => boolean) =>
  steps.slice(steps.findIndex(found) + 1);

const nextFlameAfter = (steps: any[], found: (step: any) => boolean) =>
  named(after(steps, found), 'attack', FLAME).find(
    (s) => s.attacker.id === 'kaelion',
  );

describe('Kaelion full kit', () => {
  const fight = useFight();

  const rolling = (roll: number) =>
    jest.spyOn(Math, 'random').mockReturnValue(roll);
  const alone = () => fight([kaelion], [dummy('foe', { attack: 10 })]);
  // 300 - 50 defense = 250 a hit: 280, then 70 after his 40 regeneration
  const pressed = () => fight([kaelion], [dummy('foe', { attack: 300 })]);
  // 190 a hit: the shield rises at 40 health, the next hit breaks it, not him
  const worn = () => fight([kaelion], [dummy('foe', { attack: 240 })]);

  describe(FLAME, () => {
    // 68 physical + 17 fire + 8.5 earth -> 9
    it('[KAE-ATK-1] strikes for 80% physical, 20% fire and 10% earth', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', FLAME)[0].damages[0]).toMatchObject({
        damage: 94,
        kind: ['PHYSICAL', 'FIRE', 'EARTH'],
      });
    });

    it('[KAE-ATK-2] burns its target for 10% of his attack on a roll under 50%', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(
        steps.find((s) => s.kind === 'state_effect' && s.type === 'burn')
          .damage,
      ).toBe(8.5);
    });

    // Its duration replaces the turns of its level, which the report never shows
    it('[KAE-ATK-2] lays a light burn, level 1', () => {
      expect(kaelion.skills.simpleAttack.effects[0].level).toBe(1);
    });

    it('[KAE-ATK-2] burns for two turns', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(statusTicks(steps, 'burn', 'foe')).toEqual([1, 0]);
    });

    it('[KAE-ATK-2] does not burn on a roll of 50% or more', async () => {
      rolling(0.5);
      const steps = await alone();

      expect(statusesOn(steps, 'foe', 'burn')).toEqual([]);
    });

    it('[KAE-ATK-3] stuns its target on a roll under 20%', async () => {
      rolling(0.1);
      const steps = await alone();

      expect(statusesOn(steps, 'foe', 'stunt')).not.toEqual([]);
    });

    it('[KAE-ATK-3] does not stun on a roll of 20% or more', async () => {
      rolling(0.2);
      const steps = await alone();

      expect(statusesOn(steps, 'foe', 'stunt')).toEqual([]);
    });
  });

  describe(BASALT_HEART, () => {
    // The turn-start rushes are not his action
    it('[KAE-SPE-1] is cast on his sixth action, once 50 energy are charged', async () => {
      rolling(0.99);
      const steps = await alone();
      const ownActions = actionsOf(steps, 'kaelion').filter((n) => n !== RUSH);

      expect(ownActions.indexOf(BASALT_HEART)).toBe(5);
    });

    // 85 fire + 85 earth on each
    it('[KAE-SPE-1] strikes every enemy for 100% fire and 100% earth', async () => {
      rolling(0.99);
      const steps = await fight([kaelion], [dummy('a'), dummy('b')]);

      expect(named(steps, 'special_attack', BASALT_HEART)[0].damages).toEqual([
        expect.objectContaining({ damage: 170, kind: ['FIRE', 'EARTH'] }),
        expect.objectContaining({ damage: 170, kind: ['FIRE', 'EARTH'] }),
      ]);
    });

    it('[KAE-SPE-2] lowers the dodge of the enemies struck by 20% for 3 turns', async () => {
      rolling(0.99);
      const steps = await fight(
        [kaelion],
        [dummy('a', { agility: 50 }), dummy('b', { agility: 50 })],
      );

      expect(named(steps, 'debuff', BASALT_HEART)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'agility',
          value: 10,
          remainingTurns: 3,
        }),
        expect.objectContaining({
          kind: 'agility',
          value: 10,
          remainingTurns: 3,
        }),
      ]);
    });

    it('[KAE-SPE-3] shields him for 30% of his max health', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'shield_applied', BASALT_HEART)[0].targets).toEqual([
        expect.objectContaining({
          target: expect.objectContaining({ id: 'kaelion' }),
          points: 159,
        }),
      ]);
    });

    it('[KAE-SPE-3] lets the shield go at his next turn end', async () => {
      rolling(0.99);
      const steps = await alone();
      const shielded = steps.findIndex((s) => s.name === BASALT_HEART);

      expect(
        steps
          .slice(shielded)
          .findIndex(
            (s) => s.kind === 'shield_expired' && s.card.id === 'kaelion',
          ),
      ).toBeGreaterThan(0);
    });
  });

  describe(RUSH, () => {
    // 51 physical + 51 fire
    it('[KAE-ELA-1] strikes for 60% physical and 60% fire', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(named(steps, 'attack', RUSH)[0].damages[0]).toMatchObject({
        damage: 102,
        kind: ['PHYSICAL', 'FIRE'],
      });
    });

    // His own actions before each rush: it opens his 3rd, 6th and 9th turns
    it('[KAE-ELA-2] comes back every third turn', async () => {
      rolling(0.99);
      const steps = await alone();
      const actions = actionsOf(steps, 'kaelion');
      const ownBefore = (i: number) =>
        actions.slice(0, i).filter((name) => name !== RUSH).length;

      expect(
        actions
          .flatMap((name, i) => (name === RUSH ? [ownBefore(i)] : []))
          .slice(0, 3),
      ).toEqual([2, 5, 8]);
    });

    it('[KAE-ELA-2] fires on its own at turn start, then he still acts', async () => {
      rolling(0.99);
      const steps = await alone();
      const strikes = after(steps, (s) => s.name === RUSH).filter((s) =>
        ['attack', 'special_attack'].includes(s.kind),
      );

      expect(strikes[0]).toMatchObject({
        name: FLAME,
        attacker: expect.objectContaining({ id: 'kaelion' }),
      });
    });

    it('[KAE-ELA-3] lowers the defense of the enemy struck by 15% for 2 turns', async () => {
      rolling(0.99);
      const steps = await fight([kaelion], [dummy('foe', { defense: 100 })]);

      expect(named(steps, 'debuff', RUSH)[0].alterations).toEqual([
        expect.objectContaining({
          kind: 'defense',
          value: 15,
          remainingTurns: 2,
        }),
      ]);
    });
  });

  describe(RESILIENCE, () => {
    it('[KAE-RES-1] shields him for 30% of his max health under 30% health', async () => {
      rolling(0.99);
      const steps = await pressed();

      expect(
        named(steps, 'shield_applied', RESILIENCE)[0].targets[0].points,
      ).toBe(159);
    });

    it('[KAE-RES-1] waits for his health to fall under 30%', async () => {
      rolling(0.99);
      const steps = await pressed();
      const shielded = steps.findIndex((s) => s.name === RESILIENCE);

      expect(steps[shielded - 1].damages[0].remainingHealth).toBeLessThan(159);
    });

    // A permanent buff laid at fight start, read live: worth nothing unshielded
    it('[KAE-RES-2] holds his attack bonus from the fight start, worth 0 without the shield', async () => {
      rolling(0.99);
      const steps = await alone();

      expect(
        named(steps, 'buff', RESILIENCE_ATTACK)[0].alterations[0],
      ).toMatchObject({ kind: 'attack', value: 0, remainingTurns: null });
    });

    // 97.75 attack: 78.2 physical + 19.55 fire + 9.775 earth
    it('[KAE-RES-2] raises his attack by 15% while the basalt shield holds', async () => {
      rolling(0.99);
      const steps = await pressed();
      const flame = nextFlameAfter(steps, (s) => s.name === RESILIENCE);

      expect(flame.damages[0].damage).toBe(108);
    });

    it('[KAE-RES-2] loses the bonus once the basalt shield breaks', async () => {
      rolling(0.99);
      const steps = await worn();
      const flame = nextFlameAfter(
        steps,
        (s) => s.kind === 'shield_broken' && s.card.id === 'kaelion',
      );

      expect(flame.damages[0].damage).toBe(94);
    });

    it('[KAE-RES-2] gets nothing from the molten rock shield of his special', async () => {
      rolling(0.99);
      const steps = await alone();
      const flame = nextFlameAfter(steps, (s) => s.name === BASALT_HEART);

      expect(flame.damages[0].damage).toBe(94);
    });
  });

  describe(RECHARGE, () => {
    it('[KAE-REC-1] leaves him 1 health point on his first fatal blow', async () => {
      rolling(0.99);
      const steps = await pressed();
      const survived = steps.findIndex((s) => s.name === RECHARGE);

      expect(steps[survived - 1].damages[0].remainingHealth).toBe(1);
    });

    it('[KAE-REC-1] saves him once only', async () => {
      rolling(0.99);
      const steps = await pressed();

      expect(statusesOn(steps, 'kaelion', 'dead')).toHaveLength(1);
    });

    it('[KAE-REC-2] doubles his defense until his next turn ends', async () => {
      rolling(0.99);
      const steps = await pressed();

      expect(
        named(steps, 'buff', RECHARGE_DEFENSE)[0].alterations[0],
      ).toMatchObject({
        kind: 'defense',
        value: 50,
        remainingTurns: 1,
      });
    });

    it('[KAE-REC-2] raises his attack by 150% until his next turn ends', async () => {
      rolling(0.99);
      const steps = await pressed();

      expect(
        named(steps, 'buff', RECHARGE_ATTACK)[0].alterations[0],
      ).toMatchObject({
        kind: 'attack',
        value: 127.5,
        remainingTurns: 1,
      });
    });
  });

  describe(TEARS, () => {
    // hitter takes Arionis from 1000 to 200 in two hits, under 30%
    const avenging = () =>
      fight(
        [
          kaelion,
          dummy('arionis', {
            name: 'Arionis',
            health: 1000,
            attack: 100,
            defense: 100,
          }),
        ],
        [dummy('other', { attack: 10 }), dummy('hitter', { attack: 500 })],
      );

    // 2 x 85 fire
    it('[KAE-LAR-1] blasts the last enemy that hurt Arionis for 200% fire', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(named(steps, 'attack', TEARS)[0].damages).toEqual([
        expect.objectContaining({
          defender: expect.objectContaining({ id: 'hitter' }),
          damage: 170,
          kind: ['FIRE'],
        }),
      ]);
    });

    it('[KAE-LAR-1] waits for Arionis to fall under 30% health', async () => {
      rolling(0.99);
      const steps = await avenging();
      const blast = steps.findIndex((s) => s.name === TEARS);

      expect(steps[blast - 1].damages[0]).toMatchObject({
        defender: expect.objectContaining({ id: 'arionis' }),
        remainingHealth: 200,
      });
    });

    it('[KAE-LAR-2] raises the attack of Arionis by 10% and his defense by 20%', async () => {
      rolling(0.99);
      const steps = await avenging();

      expect(named(steps, 'buff', TEARS).map((s) => s.alterations[0])).toEqual([
        expect.objectContaining({
          target: expect.objectContaining({ id: 'arionis' }),
          kind: 'attack',
          value: 10,
        }),
        expect.objectContaining({
          target: expect.objectContaining({ id: 'arionis' }),
          kind: 'defense',
          value: 20,
        }),
      ]);
    });
  });
});
