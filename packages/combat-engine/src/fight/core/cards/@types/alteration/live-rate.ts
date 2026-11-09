import { FightingCard } from '../../fighting-card';
import { Player } from '../../../player';

/**
 * The rate of an alteration that follows the board instead of being fixed when
 * it lands: its value is read again every time the bearer stat is.
 */
export interface LiveRate {
  rateFor(bearer: FightingCard): number;
}

export function assertLivingAllyScaling(rate: number, maxRate: number): void {
  if (rate <= 0 || maxRate <= 0) {
    throw new Error(
      `Living ally scaling needs a rate and a maxRate above 0, got ${rate} and ${maxRate}`,
    );
  }
}

/** `rate` per living ally of the bearer (the bearer excluded), capped at `maxRate`. */
export class LivingAllyScaling implements LiveRate {
  constructor(
    private readonly rate: number,
    private readonly maxRate: number,
    private readonly team: Player,
  ) {
    assertLivingAllyScaling(rate, maxRate);
  }

  rateFor(bearer: FightingCard): number {
    const livingAllies = this.team.playableCards.filter(
      (card) => card !== bearer,
    ).length;

    return Math.min(this.rate * livingAllies, this.maxRate);
  }
}

/** `rate` while the bearer health ratio is strictly under `threshold`, nothing otherwise. */
export class HealthCeiling implements LiveRate {
  constructor(
    private readonly rate: number,
    private readonly threshold: number,
  ) {
    if (threshold <= 0 || threshold > 1) {
      throw new Error(
        `Health ceiling threshold must be in ]0, 1], got ${threshold}`,
      );
    }
  }

  rateFor(bearer: FightingCard): number {
    return bearer.healthRatio < this.threshold ? this.rate : 0;
  }
}
