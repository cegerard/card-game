import { FightingCard } from '../../fighting-card';
import { DamageTypeBonus } from './damage-type-bonus';

/**
 * Boosts an attack when the defender is already frozen, read before the hit
 * applies its own effects, so a freeze it is about to lay does not count.
 */
export class FrozenTargetBonus extends DamageTypeBonus {
  protected isEarned(_attacker: FightingCard, defender: FightingCard): boolean {
    return defender.isFrozen;
  }
}
