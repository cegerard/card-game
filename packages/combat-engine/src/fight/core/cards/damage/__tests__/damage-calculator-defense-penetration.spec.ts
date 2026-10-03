import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { DamageCalculator } from '../damage-calculator';

describe('DamageCalculator defense penetration', () => {
  const physical = [new DamageComposition(DamageType.PHYSICAL, 1)];
  const defender = createFightingCard({
    defense: 40,
    element: Element.PHYSICAL,
  });

  const damageWith = (defensePenetration?: number) =>
    DamageCalculator.calculateDamage(
      physical,
      100,
      defender,
      defensePenetration,
    ).total;

  it('subtracts the whole defense without penetration', () => {
    expect(damageWith()).toBe(60);
  });

  it('subtracts the whole defense at 0', () => {
    expect(damageWith(0)).toBe(60);
  });

  it('subtracts half the defense at 0.5', () => {
    expect(damageWith(0.5)).toBe(80);
  });

  it('ignores the defense at 1', () => {
    expect(damageWith(1)).toBe(100);
  });

  it('rejects a penetration above 1', () => {
    expect(() => damageWith(1.1)).toThrow();
  });

  it('rejects a negative penetration', () => {
    expect(() => damageWith(-0.1)).toThrow();
  });
});
