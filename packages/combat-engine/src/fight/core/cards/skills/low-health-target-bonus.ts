import { FightingCard } from '../fighting-card';

/**
 * Raises its owner attack by `rate` against a defender whose health ratio is
 * below `threshold` before the hit lands.
 *
 * Like `BleedStackScalingSkill`, this is not a `Skill` implementor: it has no
 * event trigger and no targeting strategy. It is read through
 * `FightingCard.attackPower()` when an attack names its defender, so status
 * effects and heals, which name none, never get it.
 */
export class LowHealthTargetBonusSkill {
  constructor(
    public readonly name: string,
    private readonly rate: number,
    private readonly threshold: number,
  ) {
    if (rate <= 0) {
      throw new Error(
        `LowHealthTargetBonusSkill rate must be greater than 0, got ${rate}`,
      );
    }
    if (threshold <= 0 || threshold > 1) {
      throw new Error(
        `LowHealthTargetBonusSkill threshold must be in ]0, 1], got ${threshold}`,
      );
    }
  }

  /** The factor its owner attack is multiplied by against `defender`. */
  public multiplierAgainst(defender: FightingCard): number {
    return defender.healthRatio < this.threshold ? 1 + this.rate : 1;
  }
}
