import { FightingCard } from '../../fighting-card';
import { DamageType } from '../damage/damage-type';
import { Element } from '../damage/element';
import { DamageTypeBonus } from './damage-type-bonus';

/**
 * Boosts an attack while a battlefield of that element runs where it is
 * fought: the attacker or the defender stands in it. A battlefield exposes
 * both sides, so a battlefield laid by anybody counts.
 */
export class BattlefieldBonus extends DamageTypeBonus {
  constructor(
    private readonly element: Element,
    damageType: DamageType | undefined,
    multiplier: number,
  ) {
    super(damageType, multiplier);
  }

  protected isEarned(attacker: FightingCard, defender: FightingCard): boolean {
    return (
      attacker.standsInBattlefieldOf(this.element) ||
      defender.standsInBattlefieldOf(this.element)
    );
  }
}
