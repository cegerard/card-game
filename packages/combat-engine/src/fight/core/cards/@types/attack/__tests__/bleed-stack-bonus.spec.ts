import { BleedStackBonus } from '../bleed-stack-bonus';
import { BleedAttackEffect } from '../attack-bleed-effect';
import { DamageComposition } from '../../damage/damage-composition';
import { DamageType } from '../../damage/damage-type';
import { MathRandomizer } from '../../../../../tools/math-randomizer';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';

const lacerationDamages = [
  new DamageComposition(DamageType.PHYSICAL, 0.6),
  new DamageComposition(DamageType.AIR, 0.4),
];

function bleedingCard(stacks: number): FightingCard {
  const card = createFightingCard({ health: 1000 });
  new BleedAttackEffect(0.05, 3, 8, new MathRandomizer(), stacks).applyEffect(
    card,
    createFightingCard({ attack: 100 }),
    null,
  );
  return card;
}

describe('BleedStackBonus', () => {
  const bonus = new BleedStackBonus(3, DamageType.PHYSICAL, 1.2);

  it('leaves the damages unchanged below the stack threshold', () => {
    expect(bonus.applyTo(lacerationDamages, bleedingCard(2))).toEqual(
      lacerationDamages,
    );
  });

  it('boosts only the targeted damage type from the threshold on', () => {
    const rates = bonus
      .applyTo(lacerationDamages, bleedingCard(3))
      .map((d) => d.rate);

    expect(rates).toEqual([0.72, 0.4]);
  });

  it.each([
    ['minStacks', () => new BleedStackBonus(0, DamageType.PHYSICAL, 1.2)],
    ['multiplier', () => new BleedStackBonus(3, DamageType.PHYSICAL, 0)],
  ])('rejects an invalid %s', (_field, build) => {
    expect(build).toThrow();
  });
});
