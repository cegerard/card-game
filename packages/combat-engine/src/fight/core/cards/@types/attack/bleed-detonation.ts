import { FightingCard } from '../../fighting-card';
import { DamageComposition } from '../damage/damage-composition';
import { DamageType } from '../damage/damage-type';

export type Detonation = {
  damages: DamageComposition[];
  consumedStacks: number;
};

/**
 * Consumes every bleed stack of the defender and turns them into a physical
 * hit worth `ratePerStack` of the attack for each consumed stack.
 */
export class BleedDetonation {
  public readonly damageType = DamageType.PHYSICAL;

  constructor(public readonly ratePerStack: number) {
    if (ratePerStack <= 0) {
      throw new Error(
        `BleedDetonation ratePerStack must be greater than 0, got ${ratePerStack}`,
      );
    }
  }

  public detonate(defender: FightingCard): Detonation {
    const consumedStacks = defender.consumeBleedStacks();

    return {
      damages: [
        new DamageComposition(
          this.damageType,
          this.ratePerStack * consumedStacks,
        ),
      ],
      consumedStacks,
    };
  }
}
