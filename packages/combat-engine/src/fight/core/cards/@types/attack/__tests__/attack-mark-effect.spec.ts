import { MarkAttackEffect } from '../attack-mark-effect';
import { ElementalMark } from '../../mark/elemental-mark';
import { DamageType } from '../../damage/damage-type';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { RandomizerFake } from '../../../../../../../test/helpers/randomizer-fake';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';
import { MarkEffectResult } from '../attack-effect';
import { EffectTriggeredDebuff } from '../effect-triggered-debuff';

function waterMark(maxStacks: number = 5): ElementalMark {
  return new ElementalMark(DamageType.WATER, 0.05, maxStacks);
}

describe('MarkAttackEffect', () => {
  let attacker: FightingCard;
  let defender: FightingCard;

  beforeEach(() => {
    attacker = createFightingCard({ attack: 100 });
    defender = createFightingCard({ health: 500 });
  });

  describe('on an unmarked defender', () => {
    let result: MarkEffectResult;

    beforeEach(() => {
      const effect = new MarkAttackEffect(waterMark(), new MathRandomizer());
      result = effect.applyEffect(defender, attacker, null);
    });

    it('applies a single stack', () => {
      expect(defender.markStacks(DamageType.WATER)).toBe(1);
    });

    it('reports the mark applied', () => {
      expect(result).toEqual({
        type: 'mark',
        card: defender,
        damageType: DamageType.WATER,
        stacks: 1,
      });
    });
  });

  describe('with several stacks per application', () => {
    beforeEach(() => {
      const effect = new MarkAttackEffect(waterMark(), new MathRandomizer(), 2);
      effect.applyEffect(defender, attacker, null);
      effect.applyEffect(defender, attacker, null);
    });

    it('accumulates every applied stack', () => {
      expect(defender.markStacks(DamageType.WATER)).toBe(4);
    });
  });

  describe('when the maximum number of stacks is reached', () => {
    let result: MarkEffectResult;

    beforeEach(() => {
      const effect = new MarkAttackEffect(waterMark(2), new MathRandomizer());
      [1, 2, 3].forEach(() => {
        result = effect.applyEffect(defender, attacker, null);
      });
    });

    it('caps the stacks to the mark maximum', () => {
      expect(defender.markStacks(DamageType.WATER)).toBe(2);
    });

    it('reports no effect once capped', () => {
      expect(result).toBeUndefined();
    });
  });

  describe('with a probability', () => {
    const randomizer = new RandomizerFake();

    it('applies the mark when the roll succeeds', () => {
      randomizer.setNextRandomValue(0.1);
      const effect = new MarkAttackEffect(waterMark(), randomizer, 1, 0.2);
      effect.applyEffect(defender, attacker, null);

      expect(defender.markStacks(DamageType.WATER)).toBe(1);
    });

    it('skips the mark when the roll fails', () => {
      randomizer.setNextRandomValue(0.5);
      const effect = new MarkAttackEffect(waterMark(), randomizer, 1, 0.2);
      effect.applyEffect(defender, attacker, null);

      expect(defender.markStacks(DamageType.WATER)).toBe(0);
    });
  });

  it('rejects an application of less than one stack', () => {
    expect(
      () => new MarkAttackEffect(waterMark(), new MathRandomizer(), 0),
    ).toThrow('MarkAttackEffect stacks must be greater than or equal to 1');
  });
});

describe('ElementalMark', () => {
  it('rejects a negative rate per stack', () => {
    expect(() => new ElementalMark(DamageType.WATER, -0.1, 5)).toThrow(
      'ElementalMark ratePerStack must be greater than or equal to 0',
    );
  });

  it('rejects a maximum below one stack', () => {
    expect(() => new ElementalMark(DamageType.WATER, 0.05, 0)).toThrow(
      'ElementalMark maxStacks must be greater than or equal to 1',
    );
  });
});

describe('MarkAttackEffect with a triggered debuff', () => {
  const randomizer = new RandomizerFake();
  let markedCard: FightingCard;
  let result: MarkEffectResult;

  beforeEach(() => {
    randomizer.setNextRandomValue(0);
    markedCard = createFightingCard({ speed: 100 });
    const effect = new MarkAttackEffect(
      waterMark(),
      new MathRandomizer(),
      1,
      undefined,
      new EffectTriggeredDebuff(1, 'speed', 0.08, 3, randomizer),
    );
    result = effect.applyEffect(
      markedCard,
      createFightingCard({ attack: 100 }),
      null,
    );
  });

  it('slows the marked card', () => {
    expect(markedCard.actualSpeed).toBe(92);
  });

  it('reports the triggered debuff alongside the mark', () => {
    expect(result.triggeredDebuff).toEqual({
      card: markedCard,
      debuff: expect.objectContaining({ type: 'speed', value: 8 }),
    });
  });
});
