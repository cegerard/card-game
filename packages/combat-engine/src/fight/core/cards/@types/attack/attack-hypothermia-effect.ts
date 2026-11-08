import { FightingCard } from '../../fighting-card';
import { AttackEffect, StateEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { CardStateHypothermia } from '../state/card-state-hypothermia';
import { Randomizer } from '../../../randomizer';

/**
 * Lays a hypothermia ticking `rate` of the defender max health for `duration`
 * turns, at least one point. It lands on a frozen card, and a new one replaces
 * the running one.
 */
export class HypothermiaAttackEffect implements AttackEffect {
  public readonly type = 'hypothermia' as const;

  constructor(
    public readonly rate: number,
    private readonly duration: number,
    private readonly randomizer: Randomizer,
    public readonly probability?: number,
    public readonly terminationEvent?: string,
  ) {
    if (rate <= 0) {
      throw new Error(
        `HypothermiaAttackEffect rate must be greater than 0, got ${rate}`,
      );
    }
    if (duration < 1) {
      throw new Error(
        `HypothermiaAttackEffect duration must be greater than or equal to 1, got ${duration}`,
      );
    }
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): StateEffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;

    const state = new CardStateHypothermia(
      this.duration,
      Math.max(1, Math.round(this.rate * defender.maxHealth)),
      this.terminationEvent,
    );
    if (!defender.setState(state)) return;

    return { type: this.type, card: defender };
  }
}
