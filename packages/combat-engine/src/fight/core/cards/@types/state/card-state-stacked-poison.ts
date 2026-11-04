import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { round2 } from '../../../../tools/round';
import { CardState } from './card-state';

/**
 * A poison counted in stacks: each stack multiplies the tick by
 * `stackMultiplier` (3%, 6%, 12% for a doubling one), and every application
 * restarts the whole poison for its duration. It remembers the card that laid
 * it last, which is how a poisoner hears of its victims' death. A freeze
 * pauses it, like the level-based poison.
 */
export class CardStateStackedPoison implements CardState {
  public readonly type = 'poison' as const;
  private amplifier = 1;

  constructor(
    private stackCount: number,
    public remainingTurns: number,
    private readonly damagePerTick: number,
    private readonly stackMultiplier: number,
    public readonly source: FightingCard,
    public readonly terminationEvent?: string,
  ) {}

  public get stacks(): number {
    return this.stackCount;
  }

  public get damage(): number {
    return round2(
      this.damagePerTick *
        this.stackMultiplier ** (this.stackCount - 1) *
        this.amplifier,
    );
  }

  /** A fresh application keeps the surge the running poison went through. */
  public carryOver(previous?: CardState): void {
    if (previous instanceof CardStateStackedPoison) {
      this.amplifier = previous.amplifier;
    }
  }

  /** Raises the poison to at least `stacks` and multiplies its damage. */
  public surge(stacks: number, damageMultiplier: number): void {
    this.stackCount = Math.max(this.stackCount, stacks);
    this.amplifier *= damageMultiplier;
  }

  public applyState(card: FightingCard): StateResult {
    if (card.isFrozen) return;

    this.remainingTurns--;
    const damage = card.addRealDamage(this.damage);

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
