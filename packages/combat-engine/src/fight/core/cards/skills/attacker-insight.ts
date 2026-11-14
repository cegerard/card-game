import { FightingCard } from '../fighting-card';

/**
 * Its owner reads the intentions of the enemies that already attacked during
 * the fight: against them it strikes with more accuracy and dodges with more
 * agility, each a share of its base stat.
 *
 * A card-bound passive like `DodgeBonusDenialSkill`: no event, no targeting,
 * consulted by `FightingCard` whenever it rolls against such an enemy.
 */
export class AttackerInsightSkill {
  constructor(
    public readonly name: string,
    private readonly accuracyRate: number,
    private readonly agilityRate: number,
  ) {
    if (accuracyRate < 0 || agilityRate < 0) {
      throw new Error(
        `AttackerInsight rates must be >= 0, got ${accuracyRate} and ${agilityRate}`,
      );
    }
  }

  public accuracyRateAgainst(enemy: FightingCard): number {
    return enemy.hasAttacked ? this.accuracyRate : 0;
  }

  public agilityRateAgainst(enemy: FightingCard): number {
    return enemy.hasAttacked ? this.agilityRate : 0;
  }
}
