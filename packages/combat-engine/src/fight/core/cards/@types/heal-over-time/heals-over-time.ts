import { FightingCard } from '../../fighting-card';

/** A heal of `rate` of the bearer max health at the start of each of its next `duration` turns. */
export type HealOverTime = {
  name: string;
  source: FightingCard;
  rate: number;
  duration: number;
};

export type HealOverTimeTick = {
  name: string;
  source: FightingCard;
  healed: number;
};

/** The heals over time one card carries, one per name. */
export class HealsOverTime {
  private heals: { heal: HealOverTime; remainingTurns: number }[] = [];

  /** Laying one again under the same name replaces it. */
  public receive(heal: HealOverTime): void {
    if (
      heal.rate <= 0 ||
      !Number.isInteger(heal.duration) ||
      heal.duration < 1
    ) {
      throw new Error(
        'A heal over time needs a rate above 0 and a duration of 1 turn at least',
      );
    }
    this.heals = [
      ...this.heals.filter((h) => h.heal.name !== heal.name),
      { heal, remainingTurns: heal.duration },
    ];
  }

  /**
   * One turn of every heal: `heals` restores the health and returns what it
   * gave. Each heal loses a turn, healing or not, and runs out at zero.
   */
  public tick(heals: (heal: HealOverTime) => number): HealOverTimeTick[] {
    const ticks = this.heals
      .map(({ heal }) => ({
        name: heal.name,
        source: heal.source,
        healed: heals(heal),
      }))
      .filter((tick) => tick.healed > 0);
    this.heals = this.heals
      .map((h) => ({ ...h, remainingTurns: h.remainingTurns - 1 }))
      .filter((h) => h.remainingTurns > 0);

    return ticks;
  }

  public clear(): void {
    this.heals = [];
  }
}
