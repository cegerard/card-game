import { FightingCard } from '../../fighting-card';
import {
  AttackEffect,
  SUPPORT_BLOCKED_TYPE,
  SupportBlockedResult,
} from './attack-effect';
import { FightingContext } from '../fighting-context';
import { Randomizer } from '../../../randomizer';

/** Cuts the defender off the heals and buffs of its allies for `duration` turns. */
export class SupportBlockAttackEffect implements AttackEffect {
  public readonly type = SUPPORT_BLOCKED_TYPE;
  public readonly rate = 0;

  constructor(
    private readonly duration: number,
    private readonly randomizer: Randomizer,
    public readonly probability?: number,
  ) {
    if (!Number.isInteger(duration) || duration < 1) {
      throw new Error(
        `Support block duration must be an integer >= 1, got ${duration}`,
      );
    }
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): SupportBlockedResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (!defender.blockSupport(this.duration)) return;

    return {
      type: this.type,
      card: defender,
      remainingTurns: this.duration,
    };
  }
}
