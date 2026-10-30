import { FightingCard } from '../../fighting-card';
import { AttackEffect, StateEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { CardStateStackedPoison } from '../state/card-state-stacked-poison';
import { round2 } from '../../../../tools/round';
import { Randomizer } from '../../../randomizer';
import { RATE_BASES, RateBasis } from '../rate-basis';

export type StackedPoisonOptions = {
  stacks?: number;
  basis?: RateBasis;
  probability?: number;
  triggeredDebuff?: EffectTriggeredDebuff;
  terminationEvent?: string;
  /** Lays the poison through a damage-over-time immunity. */
  ignoresImmunity?: boolean;
};

/**
 * Adds `stacks` to the target poison, up to `maxStacks`, and restarts it for
 * `duration` turns. Each application keeps a poison already above its own cap
 * where it is. At the cap it still restarts the poison.
 */
export class StackedPoisonAttackEffect implements AttackEffect {
  public readonly type = 'poison' as const;
  public readonly probability?: number;
  public readonly triggeredDebuff?: EffectTriggeredDebuff;
  public readonly terminationEvent?: string;
  private readonly stacks: number;
  private readonly basis: RateBasis;
  private readonly ignoresImmunity: boolean;

  constructor(
    public readonly rate: number,
    private readonly duration: number,
    private readonly maxStacks: number,
    private readonly stackMultiplier: number,
    private readonly randomizer: Randomizer,
    options: StackedPoisonOptions = {},
  ) {
    this.stacks = options.stacks ?? 1;
    this.basis = options.basis ?? 'source-attack';
    this.probability = options.probability;
    this.triggeredDebuff = options.triggeredDebuff;
    this.terminationEvent = options.terminationEvent;
    this.ignoresImmunity = options.ignoresImmunity ?? false;
    if (!RATE_BASES.includes(this.basis)) {
      throw new Error(`Unknown poison basis: ${this.basis}`);
    }
    if (stackMultiplier <= 0) {
      throw new Error(
        `StackedPoisonAttackEffect stackMultiplier must be greater than 0, got ${stackMultiplier}`,
      );
    }
    const counts = { duration, maxStacks, stacks: this.stacks };
    Object.entries(counts).forEach(([field, value]) => {
      if (value < 1) {
        throw new Error(
          `StackedPoisonAttackEffect ${field} must be greater than or equal to 1, got ${value}`,
        );
      }
    });
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    context: FightingContext,
  ): StateEffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.frozenLevel > 0) return;

    const current = defender.poisonStacks();
    const poison = new CardStateStackedPoison(
      Math.max(current, Math.min(current + this.stacks, this.maxStacks)),
      this.duration,
      round2(
        this.basis === 'target-max-health'
          ? defender.maxHealth * this.rate
          : card.attackPower(context) * this.rate,
      ),
      this.stackMultiplier,
      card,
      this.terminationEvent,
    );
    if (!defender.setState(poison, { ignoresImmunity: this.ignoresImmunity }))
      return;
    card.recordPoisonedCard(defender);

    const effectResult: StateEffectResult = {
      type: this.type,
      card: defender,
      stacks: poison.stacks,
    };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }
}
