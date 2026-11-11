import { FightingCard } from '../../fighting-card';
import { AttackEffect, StateEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import {
  CardStateEntangled,
  assertFailChance,
} from '../state/card-state-entangled';
import { Randomizer } from '../../../randomizer';

/**
 * Entangles the defender: its next offensive action fails on `rate`. A control
 * status, so immunity and resistance refuse it like a stun.
 */
export class EntangleAttackEffect implements AttackEffect {
  public readonly type = 'entangle' as const;

  constructor(
    public readonly rate: number,
    private readonly randomizer: Randomizer,
    public readonly probability?: number,
    public readonly terminationEvent?: string,
  ) {
    assertFailChance(rate);
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

    const entangled = new CardStateEntangled(this.rate, this.terminationEvent);
    if (!defender.setState(entangled)) return;

    return { type: this.type, card: defender };
  }
}
