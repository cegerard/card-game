import { Randomizer } from '../../randomizer';

/**
 * Removes a share of the incoming damage before it reaches the shield buffer
 * and the health pool.
 *
 * Like `SurviveSkill`, this is not a `Skill` implementor: it has no event
 * trigger and no targeting strategy. It is consulted inside
 * `FightingCard.applyFinalDamage()`, so the mitigation applies to the very hit
 * that triggers it rather than to the next one. An optional `probability`
 * makes the mitigation a per-hit roll; without it the reduction is permanent.
 */
export class DamageReductionSkill {
  constructor(
    public readonly name: string,
    private readonly rate: number,
    private readonly randomizer: Randomizer,
    private readonly probability?: number,
  ) {
    if (rate <= 0 || rate > 1) {
      throw new Error(`rate must be in ]0, 1], got: ${rate}`);
    }
    if (probability !== undefined && (probability < 0 || probability > 1)) {
      throw new Error(`probability must be in [0, 1], got: ${probability}`);
    }
  }

  /**
   * Returns the damage left after mitigation, or undefined when the roll
   * fails and the damage must go through untouched.
   */
  public tryMitigate(damage: number): number | undefined {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    ) {
      return undefined;
    }

    return Math.round(damage * (1 - this.rate));
  }
}
