import { FightingCard } from '../../fighting-card';
import { DamageTypeBonus } from './damage-type-bonus';

/**
 * Boosts one damage type of an attack struck from concealment. Read while the
 * attack resolves, before the attack itself lifts the concealment, so every
 * hit of that action benefits from it.
 */
export class ConcealedBonus extends DamageTypeBonus {
  protected isEarned(attacker: FightingCard): boolean {
    return attacker.isConcealed();
  }
}
