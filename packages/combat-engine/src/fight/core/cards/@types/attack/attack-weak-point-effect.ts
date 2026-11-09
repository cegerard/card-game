import { FightingCard } from '../../fighting-card';
import { AttackEffect, WeakPointEffectResult } from './attack-effect';
import { FightingContext } from '../fighting-context';
import { Randomizer } from '../../../randomizer';
import {
  WEAK_POINT_EFFECT_TYPE,
  WeakPoint,
  WeakPointSpec,
  validateWeakPointSpec,
} from '../weak-point/weak-point';

/**
 * Reveals a weak point on the defender, the attacker being its revealer. Not
 * a status: no immunity or resistance refuses it.
 */
export class WeakPointAttackEffect implements AttackEffect {
  public readonly type = WEAK_POINT_EFFECT_TYPE;
  public readonly rate = 0;

  constructor(
    private readonly spec: WeakPointSpec,
    private readonly randomizer: Randomizer,
    public readonly probability?: number,
  ) {
    validateWeakPointSpec(spec);
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): WeakPointEffectResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;

    const weakPoint = defender.revealWeakPoint(new WeakPoint(this.spec, card));
    return weakPoint && { type: this.type, card: defender, weakPoint };
  }
}
