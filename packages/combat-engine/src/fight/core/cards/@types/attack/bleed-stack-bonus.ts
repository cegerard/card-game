import { FightingCard } from '../../fighting-card';
import { DamageComposition } from '../damage/damage-composition';
import { DamageType } from '../damage/damage-type';

/**
 * Boosts one damage type of an attack when the defender already bleeds from
 * at least `minStacks` stacks. Evaluated before the hit applies its own
 * effects, so the stacks it is about to add do not count.
 */
export class BleedStackBonus {
  constructor(
    public readonly minStacks: number,
    public readonly damageType: DamageType,
    public readonly multiplier: number,
  ) {
    if (minStacks < 1) {
      throw new Error(
        `BleedStackBonus minStacks must be greater than or equal to 1, got ${minStacks}`,
      );
    }
    if (multiplier <= 0) {
      throw new Error(
        `BleedStackBonus multiplier must be greater than 0, got ${multiplier}`,
      );
    }
  }

  public applyTo(
    damages: DamageComposition[],
    defender: FightingCard,
  ): DamageComposition[] {
    if (defender.bleedStacks() < this.minStacks) return damages;

    return damages.map((damage) =>
      damage.type === this.damageType
        ? new DamageComposition(damage.type, damage.rate * this.multiplier)
        : damage,
    );
  }
}
