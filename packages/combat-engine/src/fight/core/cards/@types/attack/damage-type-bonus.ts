import { FightingCard } from '../../fighting-card';
import { DamageComposition } from '../damage/damage-composition';
import { DamageType } from '../damage/damage-type';

/**
 * Multiplies the share of one damage type in an attack when a condition on
 * the attacker or the defender holds. It rewrites the attack compositions
 * rather than the attack power, so the other damage types of a mixed hit are
 * left untouched.
 */
export abstract class DamageTypeBonus {
  constructor(
    public readonly damageType: DamageType,
    public readonly multiplier: number,
  ) {
    if (multiplier <= 0) {
      throw new Error(
        `${this.constructor.name} multiplier must be greater than 0, got ${multiplier}`,
      );
    }
  }

  protected abstract isEarned(
    attacker: FightingCard,
    defender: FightingCard,
  ): boolean;

  public applyTo(
    damages: DamageComposition[],
    attacker: FightingCard,
    defender: FightingCard,
  ): DamageComposition[] {
    if (!this.isEarned(attacker, defender)) return damages;

    return damages.map((damage) =>
      damage.type === this.damageType
        ? new DamageComposition(damage.type, damage.rate * this.multiplier)
        : damage,
    );
  }
}

/** Applies every bonus an attack carries, in order, to its compositions. */
export function applyDamageBonuses(
  bonuses: DamageTypeBonus[],
  damages: DamageComposition[],
  attacker: FightingCard,
  defender: FightingCard,
): DamageComposition[] {
  return bonuses.reduce(
    (current, bonus) => bonus.applyTo(current, attacker, defender),
    damages,
  );
}
