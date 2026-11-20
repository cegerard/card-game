import { DamageType } from '@card-game/shared-types';
import { ElementalMark } from './elemental-mark';

type MarkEntry = {
  mark: ElementalMark;
  stacks: number;
};

/** The marks a card carries, one counter per damage type; they never expire. */
export class ElementalMarks {
  private readonly marks: MarkEntry[] = [];

  /** Adds stacks up to the cap of the mark; returns the count after it. */
  public apply(mark: ElementalMark, stacks: number = 1): number {
    const entry = this.find(mark.damageType);
    if (!entry) {
      const appliedStacks = Math.min(stacks, mark.maxStacks);
      this.marks.push({ mark, stacks: appliedStacks });
      return appliedStacks;
    }

    entry.stacks = Math.min(entry.stacks + stacks, entry.mark.maxStacks);
    return entry.stacks;
  }

  public stacks(damageType: DamageType): number {
    return this.find(damageType)?.stacks ?? 0;
  }

  /** What a hit of that damage type is multiplied by. */
  public amplifier(damageType: DamageType): number {
    const entry = this.find(damageType);
    if (!entry) return 1;

    return 1 + entry.stacks * entry.mark.ratePerStack;
  }

  private find(damageType: DamageType): MarkEntry | undefined {
    return this.marks.find((entry) => entry.mark.damageType === damageType);
  }
}
