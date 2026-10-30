import { Randomizer } from '../../../randomizer';
import { round2 } from '../../../../tools/round';

/**
 * A chance rolled once per event that grows each time it does not fire: none
 * before the `fromTurn`-th event, then `startChance`, plus `increment` at
 * every event that did not fire, a blocked one included. Firing drops it
 * back to 0, from where it grows again.
 */
export class RampingChance {
  private events = 0;
  private chance: number;

  constructor(
    startChance: number,
    private readonly increment: number,
    private readonly fromTurn: number,
    private readonly randomizer: Randomizer,
  ) {
    if (startChance < 0 || startChance > 1) {
      throw new Error(`startChance must be in [0, 1], got: ${startChance}`);
    }
    if (increment < 0) {
      throw new Error(`increment must be at least 0, got: ${increment}`);
    }
    if (fromTurn < 1) {
      throw new Error(`fromTurn must be at least 1, got: ${fromTurn}`);
    }
    this.chance = startChance;
  }

  /** Counts one event and tells whether it fires; a blocked event never does. */
  public roll(blocked: boolean): boolean {
    this.events++;
    if (this.events < this.fromTurn) return false;

    if (!blocked && this.randomizer.random() < this.chance) {
      this.chance = 0;
      return true;
    }

    this.chance = Math.min(1, round2(this.chance + this.increment));
    return false;
  }
}
