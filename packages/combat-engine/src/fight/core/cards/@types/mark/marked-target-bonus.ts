import { FightingCard } from '../../fighting-card';
import { DamageType } from '../damage/damage-type';

/**
 * Damage bonus applied when the defender already carries a mark of a given
 * damage type. Evaluated before the attack applies its own effects.
 */
export class MarkedTargetBonus {
  public readonly damageType: DamageType;
  public readonly multiplier: number;

  constructor(damageType: DamageType, multiplier: number) {
    if (multiplier <= 0) {
      throw new Error(
        `MarkedTargetBonus multiplier must be greater than 0, got ${multiplier}`,
      );
    }

    this.damageType = damageType;
    this.multiplier = multiplier;
  }

  public multiplierFor(defender: FightingCard): number {
    return defender.markStacks(this.damageType) > 0 ? this.multiplier : 1;
  }
}
