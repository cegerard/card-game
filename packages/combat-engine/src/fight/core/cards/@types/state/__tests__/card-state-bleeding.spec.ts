import { BleedAttackEffect } from '../../attack/attack-bleed-effect';
import { CardStateFrozen } from '../card-state-frozen';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';

function bleed(duration: number, stacks = 1, terminationEvent?: string) {
  return new BleedAttackEffect(
    0.05,
    duration,
    8,
    new MathRandomizer(),
    stacks,
    undefined,
    undefined,
    terminationEvent,
  );
}

describe('Bleeding card', () => {
  let attacker: FightingCard;
  let bleeder: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    bleeder = createFightingCard({ health: 500 });
  });

  describe('at the end of a turn', () => {
    it('takes the damage of every stack', () => {
      bleed(3, 2).applyEffect(bleeder, attacker, null);

      const [tick] = bleeder.applyStateEffects();

      expect(tick.damage).toBe(10);
    });

    it('reports the remaining stacks and turns', () => {
      bleed(3, 2).applyEffect(bleeder, attacker, null);

      const [tick] = bleeder.applyStateEffects();

      expect(tick).toEqual(
        expect.objectContaining({
          type: 'bleed',
          remainingTurns: 2,
          remainingStacks: 2,
        }),
      );
    });
  });

  describe('while frozen', () => {
    beforeEach(() => {
      bleed(3).applyEffect(bleeder, attacker, null);
      bleeder.setState(new CardStateFrozen(1, 1, 0.2));
    });

    it('does not bleed', () => {
      const ticks = bleeder.applyStateEffects();

      expect(ticks.map((t) => t.type)).not.toContain('bleed');
    });

    it('resumes with its stacks duration intact once thawed', () => {
      bleeder.applyStateEffects();

      const [tick] = bleeder.applyStateEffects();

      expect(tick.remainingTurns).toBe(2);
    });
  });

  describe('with stacks applied at different turns', () => {
    beforeEach(() => {
      bleed(2).applyEffect(bleeder, attacker, null);
      bleeder.applyStateEffects();
      bleed(3).applyEffect(bleeder, attacker, null);
      bleeder.applyStateEffects();
    });

    it('lets each stack expire on its own', () => {
      expect(bleeder.bleedStacks()).toBe(1);
    });

    it('stops bleeding once the last stack expires', () => {
      bleeder.applyStateEffects();
      bleeder.applyStateEffects();

      expect(bleeder.bleedStacks()).toBe(0);
    });
  });

  it('sizes each stack on the attack of its own source', () => {
    bleed(3).applyEffect(bleeder, attacker, null);
    bleed(3).applyEffect(bleeder, createFightingCard({ attack: 300 }), null);

    const [tick] = bleeder.applyStateEffects();

    expect(tick.damage).toBe(20);
  });

  describe('when an end event fires', () => {
    beforeEach(() => {
      bleed(3, 1, 'power-end').applyEffect(bleeder, attacker, null);
      bleed(3, 2).applyEffect(bleeder, attacker, null);
    });

    it('removes only the stacks bound to that event', () => {
      bleeder.removeEventBoundEffects('power-end');

      expect(bleeder.bleedStacks()).toBe(2);
    });

    it('reports the bleed as removed', () => {
      const removed = bleeder.removeEventBoundEffects('power-end');

      expect(removed).toEqual([{ type: 'bleed', card: bleeder.identityInfo }]);
    });
  });
});
