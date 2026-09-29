import { BleedAttackEffect } from '../attack-bleed-effect';
import { CardStateFrozen } from '../../state/card-state-frozen';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { StateEffectResult } from '../attack-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';

function bleed(
  params: { stacks?: number; maxStacks?: number; probability?: number } = {},
  randomizer = new MathRandomizer(),
): BleedAttackEffect {
  return new BleedAttackEffect(
    0.05,
    3,
    params.maxStacks ?? 8,
    randomizer,
    params.stacks,
    params.probability,
  );
}

describe('BleedAttackEffect', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 500 });
  });

  describe('on a defender that does not bleed', () => {
    let result: StateEffectResult;

    beforeEach(() => {
      result = bleed().applyEffect(defender, attacker, null);
    });

    it('applies a single stack', () => {
      expect(defender.bleedStacks()).toBe(1);
    });

    it('reports the bleed with the resulting stack count', () => {
      expect(result).toEqual({ type: 'bleed', card: defender, stacks: 1 });
    });
  });

  describe('with several stacks per application', () => {
    it('accumulates every applied stack', () => {
      const effect = bleed({ stacks: 2 });
      effect.applyEffect(defender, attacker, null);
      effect.applyEffect(defender, attacker, null);

      expect(defender.bleedStacks()).toBe(4);
    });
  });

  describe('when the maximum number of stacks is reached', () => {
    let result: StateEffectResult;

    beforeEach(() => {
      const effect = bleed({ stacks: 2, maxStacks: 3 });
      [1, 2, 3].forEach(() => {
        result = effect.applyEffect(defender, attacker, null);
      });
    });

    it('caps the stacks to the maximum', () => {
      expect(defender.bleedStacks()).toBe(3);
    });

    it('reports nothing once capped', () => {
      expect(result).toBeUndefined();
    });
  });

  describe('with a probability', () => {
    it('applies nothing when the roll fails', () => {
      const randomizer = new RandomizerFake().setNextRandomValue(0.9);
      bleed({ probability: 0.5 }, randomizer).applyEffect(
        defender,
        attacker,
        null,
      );

      expect(defender.bleedStacks()).toBe(0);
    });
  });

  describe('on a defender immune to statuses', () => {
    it('applies nothing', () => {
      defender.applyStatusImmunity(2);
      bleed().applyEffect(defender, attacker, null);

      expect(defender.bleedStacks()).toBe(0);
    });
  });

  describe('on a defender winning its resistance roll', () => {
    it('applies nothing', () => {
      const resistant = createFightingCard({
        resistance: 200,
        randomizer: new RandomizerFake().setNextRandomValue(0),
      });
      bleed().applyEffect(resistant, attacker, null);

      expect(resistant.bleedStacks()).toBe(0);
    });
  });

  describe('on a frozen defender', () => {
    it('still applies the bleed', () => {
      defender.setState(new CardStateFrozen(1, 1, 0.2));
      bleed().applyEffect(defender, attacker, null);

      expect(defender.bleedStacks()).toBe(1);
    });
  });

  describe('with a triggered debuff', () => {
    it('reports the debuff applied with the bleed', () => {
      const triggered = new EffectTriggeredDebuff(
        1,
        'defense',
        0.1,
        2,
        new RandomizerFake(),
      );
      const effect = new BleedAttackEffect(
        0.05,
        3,
        8,
        null,
        1,
        undefined,
        triggered,
      );

      const result = effect.applyEffect(defender, attacker, null);

      expect(result.triggeredDebuff.debuff.type).toBe('defense');
    });
  });

  describe('with an invalid configuration', () => {
    it.each([
      ['duration', () => new BleedAttackEffect(0.05, 0, 8, null)],
      ['maxStacks', () => new BleedAttackEffect(0.05, 3, 0, null)],
      ['stacks', () => new BleedAttackEffect(0.05, 3, 8, null, 0)],
    ])('rejects a %s lower than 1', (_field, build) => {
      expect(build).toThrow();
    });
  });
});
