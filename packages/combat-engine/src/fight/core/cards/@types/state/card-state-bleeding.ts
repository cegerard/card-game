import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { CardState } from './card-state';

export type BleedStack = {
  remainingTurns: number;
  damageValue: number;
  terminationEvent?: string;
};

/**
 * Unlike the other statuses, a bleed accumulates: every application adds
 * stacks carrying their own duration and damage, and the card bleeds for the
 * sum of its stacks at each turn end. A freeze pauses it: no damage, and the
 * stacks keep their remaining turns until the card thaws.
 */
export class CardStateBleeding implements CardState {
  public readonly type = 'bleed' as const;
  private stacks: BleedStack[];

  constructor(stacks: BleedStack[]) {
    this.stacks = stacks;
  }

  public get stackCount(): number {
    return this.stacks.length;
  }

  public get remainingTurns(): number {
    return Math.max(0, ...this.stacks.map((stack) => stack.remainingTurns));
  }

  public addStacks(other: CardStateBleeding): void {
    this.stacks.push(...other.stacks);
  }

  /**
   * Removes the stacks bound to that event and tells whether any was removed.
   */
  public removeStacksBoundTo(eventName: string): boolean {
    const kept = this.stacks.filter(
      (stack) => stack.terminationEvent !== eventName,
    );
    const removedAny = kept.length < this.stacks.length;
    this.stacks = kept;

    return removedAny;
  }

  public applyState(card: FightingCard): StateResult {
    if (card.isFrozen) return;

    const bleedDamage = this.stacks.reduce(
      (sum, stack) => sum + stack.damageValue,
      0,
    );
    this.stacks.forEach((stack) => stack.remainingTurns--);
    this.stacks = this.stacks.filter((stack) => stack.remainingTurns > 0);
    const damage = card.addRealDamage(bleedDamage);

    return {
      type: this.type,
      card,
      damage,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
      remainingStacks: this.stackCount,
    };
  }
}
