import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { DamageType } from '../@types/damage/damage-type';
import { ElementalMark } from '../@types/mark/elemental-mark';
import { FightingCard } from '../fighting-card';

describe('FightingCard elemental marks', () => {
  let card: FightingCard;

  beforeEach(() => {
    card = createFightingCard({ health: 500 });
  });

  describe('without any mark', () => {
    it('has no stack', () => {
      expect(card.markStacks(DamageType.WATER)).toBe(0);
    });

    it('does not amplify received damage', () => {
      expect(card.markAmplifier(DamageType.WATER)).toBe(1);
    });
  });

  describe('with stacked marks', () => {
    beforeEach(() => {
      const mark = new ElementalMark(DamageType.WATER, 0.05, 5);
      card.applyMark(mark, 3);
    });

    it('amplifies the marked damage type', () => {
      expect(card.markAmplifier(DamageType.WATER)).toBeCloseTo(1.15);
    });

    it('leaves the other damage types untouched', () => {
      expect(card.markAmplifier(DamageType.FIRE)).toBe(1);
    });
  });

  it('caps a single application to the mark maximum', () => {
    const mark = new ElementalMark(DamageType.WATER, 0.05, 5);

    expect(card.applyMark(mark, 8)).toBe(5);
  });

  it('marks each damage type independently', () => {
    card.applyMark(new ElementalMark(DamageType.WATER, 0.05, 5), 2);
    card.applyMark(new ElementalMark(DamageType.FIRE, 0.1, 3), 1);

    expect(card.markStacks(DamageType.WATER)).toBe(2);
  });
});
