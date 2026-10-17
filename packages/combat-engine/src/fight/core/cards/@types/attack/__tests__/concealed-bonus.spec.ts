import { ConcealedBonus } from '../concealed-bonus';
import { DamageComposition } from '../../damage/damage-composition';
import { DamageType } from '../../damage/damage-type';
import { createFightingCard } from '../../../../../../../test/helpers/fighting-card';
import { FightingCard } from '../../../fighting-card';

const lacerationDamages = [
  new DamageComposition(DamageType.PHYSICAL, 0.75),
  new DamageComposition(DamageType.EARTH, 0.45),
];

describe('ConcealedBonus', () => {
  const bonus = new ConcealedBonus(DamageType.PHYSICAL, 1.5);
  let attacker: FightingCard;
  const defender = createFightingCard({});

  beforeEach(() => {
    attacker = createFightingCard({});
  });

  it('leaves the damages unchanged when the attacker is visible', () => {
    expect(bonus.applyTo(lacerationDamages, attacker, defender)).toEqual(
      lacerationDamages,
    );
  });

  it('boosts only the targeted damage type from concealment', () => {
    attacker.conceal('Marche Fantôme');

    const rates = bonus
      .applyTo(lacerationDamages, attacker, defender)
      .map((d) => d.rate);

    expect(rates).toEqual([1.125, 0.45]);
  });

  it('rejects a multiplier that is not positive', () => {
    expect(() => new ConcealedBonus(DamageType.PHYSICAL, 0)).toThrow(
      'ConcealedBonus multiplier must be greater than 0, got 0',
    );
  });
});
