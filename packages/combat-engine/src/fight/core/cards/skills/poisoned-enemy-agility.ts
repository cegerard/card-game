/**
 * Raises its owner agility by `perEnemyRate` of its base agility for every
 * living card carrying a stacked poison the owner laid, up to `maxRate`.
 *
 * Like `BleedStackScalingSkill`, this is not a `Skill` implementor: it has no
 * event trigger and no targeting strategy, and it is read each time the owner
 * agility is, so it follows the poisons as they are laid and run out.
 */
export class PoisonedEnemyAgilitySkill {
  constructor(
    public readonly name: string,
    private readonly perEnemyRate: number,
    private readonly maxRate: number,
  ) {
    if (perEnemyRate <= 0) {
      throw new Error(
        `PoisonedEnemyAgilitySkill perEnemyRate must be greater than 0, got ${perEnemyRate}`,
      );
    }
    if (maxRate <= 0) {
      throw new Error(
        `PoisonedEnemyAgilitySkill maxRate must be greater than 0, got ${maxRate}`,
      );
    }
  }

  /** The share of base agility added for that many poisoned cards. */
  public rateFor(poisonedCards: number): number {
    return Math.min(poisonedCards * this.perEnemyRate, this.maxRate);
  }
}
