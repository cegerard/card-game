import { DamageType } from '../damage/damage-type';

export const MARK_EFFECT_TYPE = 'mark';

/**
 * Cumulative mark amplifying the damage a card receives from a damage type.
 * Each stack adds `ratePerStack` to the received damage of that type.
 */
export class ElementalMark {
  public readonly damageType: DamageType;
  public readonly ratePerStack: number;
  public readonly maxStacks: number;

  constructor(damageType: DamageType, ratePerStack: number, maxStacks: number) {
    if (ratePerStack < 0) {
      throw new Error(
        `ElementalMark ratePerStack must be greater than or equal to 0, got ${ratePerStack}`,
      );
    }

    if (maxStacks < 1) {
      throw new Error(
        `ElementalMark maxStacks must be greater than or equal to 1, got ${maxStacks}`,
      );
    }

    this.damageType = damageType;
    this.ratePerStack = ratePerStack;
    this.maxStacks = maxStacks;
  }
}
