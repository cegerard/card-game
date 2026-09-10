import { createFightingCard } from '../../../../../../test/helpers/fighting-card';
import { DamageComposition } from '../../@types/damage/damage-composition';
import { DamageType } from '../../@types/damage/damage-type';
import { Element } from '../../@types/damage/element';
import { ElementalMark } from '../../@types/mark/elemental-mark';
import { FightingCard } from '../../fighting-card';
import { DamageCalculator } from '../damage-calculator';

describe('DamageCalculator with an elemental mark', () => {
  let defender: FightingCard;

  beforeEach(() => {
    defender = createFightingCard({
      defense: 0,
      element: Element.PHYSICAL,
    });
    defender.applyMark(new ElementalMark(DamageType.WATER, 0.05, 5), 4);
  });

  it('amplifies the marked damage type', () => {
    const damages = [new DamageComposition(DamageType.WATER, 1)];

    const result = DamageCalculator.calculateDamage(damages, 100, defender);

    expect(result.total).toBe(120);
  });

  it('leaves the other damage types untouched', () => {
    const damages = [new DamageComposition(DamageType.PHYSICAL, 1)];

    const result = DamageCalculator.calculateDamage(damages, 100, defender);

    expect(result.total).toBe(100);
  });

  it('amplifies only the marked part of a composite attack', () => {
    const damages = [
      new DamageComposition(DamageType.PHYSICAL, 0.8),
      new DamageComposition(DamageType.WATER, 0.4),
    ];

    const result = DamageCalculator.calculateDamage(damages, 100, defender);

    expect(result.total).toBe(128);
  });
});
