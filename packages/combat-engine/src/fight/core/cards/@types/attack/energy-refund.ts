import { FightingCard } from '../../fighting-card';

/**
 * Energy a special gives back to its caster when the caster accuracy beats the
 * agility of the primary target by more than `minAccuracyMargin`. The agility
 * read is the one the target dodges this caster with.
 */
export class EnergyRefund {
  constructor(
    public readonly amount: number,
    public readonly minAccuracyMargin: number,
  ) {
    if (amount <= 0) {
      throw new Error(
        `EnergyRefund amount must be greater than 0, got ${amount}`,
      );
    }
    if (minAccuracyMargin < 0) {
      throw new Error(
        `EnergyRefund minAccuracyMargin must be greater than or equal to 0, got ${minAccuracyMargin}`,
      );
    }
  }

  public amountFor(
    source: FightingCard,
    target: FightingCard | undefined,
  ): number {
    if (!target) return 0;

    const margin = source.actualAccuracy - target.agilityAgainst(source);

    return margin > this.minAccuracyMargin ? this.amount : 0;
  }
}
