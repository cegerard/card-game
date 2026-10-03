import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageType } from '../@types/damage/damage-type';
import { FightingCard } from '../fighting-card';
import { ElementalMatrix } from './elemental-matrix';

export interface DamageBreakdown {
  type: DamageType;
  amount: number;
}

export interface DamageCalculationResult {
  total: number;
  breakdown: DamageBreakdown[];
}

export class DamageCalculator {
  /**
   * @param defensePenetration - Share of the defender defense the attack
   *   ignores, in [0, 1]; 0 subtracts the whole defense.
   */
  public static calculateDamage(
    damages: DamageComposition[],
    attackStat: number,
    defender: FightingCard,
    defensePenetration = 0,
  ): DamageCalculationResult {
    if (defensePenetration < 0 || defensePenetration > 1) {
      throw new Error(
        `defensePenetration must be within [0, 1], got ${defensePenetration}`,
      );
    }
    const effectiveDamages = this.getEffectiveDamages(damages);
    const defenderElement = defender.cardElement;
    const defense = defender.actualDefense * (1 - defensePenetration);

    const breakdown: DamageBreakdown[] = effectiveDamages.map((composition) => {
      const bruteDamage = attackStat * composition.rate;
      const multiplier = ElementalMatrix.getMultiplier(
        composition.type,
        defenderElement,
      );
      const markAmplifier = defender.markAmplifier(composition.type);
      const afterMatrix = bruteDamage * multiplier * markAmplifier;
      const afterDefense = Math.max(0, afterMatrix - defense);

      return {
        type: composition.type,
        amount: Math.round(afterDefense),
      };
    });

    const total = breakdown.reduce((sum, damage) => sum + damage.amount, 0);

    return { total, breakdown };
  }

  private static getEffectiveDamages(
    damages: DamageComposition[],
  ): DamageComposition[] {
    if (damages.length === 0) {
      return [new DamageComposition(DamageType.PHYSICAL, 1)];
    }
    return damages;
  }
}
