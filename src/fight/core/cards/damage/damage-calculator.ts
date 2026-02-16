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
  public static calculateDamage(
    damages: DamageComposition[],
    attackStat: number,
    defender: FightingCard,
  ): DamageCalculationResult {
    const effectiveDamages = this.getEffectiveDamages(damages);
    const defenderElement = defender.cardElement;
    const defense = defender.actualDefense;

    const breakdown: DamageBreakdown[] = effectiveDamages.map((composition) => {
      const bruteDamage = attackStat * composition.rate;
      const multiplier = ElementalMatrix.getMultiplier(
        composition.type,
        defenderElement,
      );
      const afterMatrix = bruteDamage * multiplier;
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
