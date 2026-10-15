import { FightingCard } from '../../fighting-card';
import { DamageType } from '../damage/damage-type';
import { DamageTypeBonus } from './damage-type-bonus';

/**
 * Boosts one damage type of an attack when the defender already bleeds from
 * at least `minStacks` stacks. Evaluated before the hit applies its own
 * effects, so the stacks it is about to add do not count.
 */
export class BleedStackBonus extends DamageTypeBonus {
  constructor(
    public readonly minStacks: number,
    damageType: DamageType,
    multiplier: number,
  ) {
    super(damageType, multiplier);
    if (minStacks < 1) {
      throw new Error(
        `BleedStackBonus minStacks must be greater than or equal to 1, got ${minStacks}`,
      );
    }
  }

  protected isEarned(_attacker: FightingCard, defender: FightingCard): boolean {
    return defender.bleedStacks() >= this.minStacks;
  }
}
