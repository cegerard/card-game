import { StatusCategory } from '@card-game/shared-types';
import { Stance, StanceActivation } from './stance';

/** The stances a card holds, each on its own clock. */
export class Stances {
  private stances: Stance[] = [];

  /**
   * Opens a stance, or refreshes the duration of one already running:
   * re-casting the power that grants it must not double its length, and what
   * the stance grants is kept unless the refresh states it again.
   */
  public activate({
    name,
    duration,
    immunities,
    revealsConcealed,
    evasionChance,
  }: StanceActivation): Stance {
    const running = this.stances.find((s) => s.name === name);
    if (running) {
      running.remainingTurns = duration;
      running.immunities = immunities ?? running.immunities;
      running.revealsConcealed = revealsConcealed ?? running.revealsConcealed;
      running.evasionChance = evasionChance ?? running.evasionChance;
      return running;
    }

    const stance: Stance = {
      name,
      remainingTurns: duration,
      immunities,
      revealsConcealed,
      evasionChance,
    };
    this.stances.push(stance);
    return stance;
  }

  public has(name: string): boolean {
    return this.stances.some((s) => s.name === name);
  }

  /** Closes a running stance before its time; returns whether it was held. */
  public end(name: string): boolean {
    const held = this.has(name);
    this.stances = this.stances.filter((s) => s.name !== name);
    return held;
  }

  /** Decrements every running stance and returns the ones that just ended. */
  public decreaseDurations(): string[] {
    const decremented = this.stances.map((s) => ({
      ...s,
      remainingTurns: s.remainingTurns - 1,
    }));
    const ended = decremented.filter((s) => s.remainingTurns < 0);
    this.stances = decremented.filter((s) => s.remainingTurns >= 0);

    return ended.map((s) => s.name);
  }

  public grantImmunityTo(category: StatusCategory): boolean {
    return this.stances.some((stance) => stance.immunities?.includes(category));
  }

  public get revealConcealed(): boolean {
    return this.stances.some((stance) => stance.revealsConcealed);
  }

  /** The best evasion chance among the running stances. */
  public get evasionChance(): number {
    return Math.max(0, ...this.stances.map((s) => s.evasionChance ?? 0));
  }

  public clear(): void {
    this.stances = [];
  }
}
