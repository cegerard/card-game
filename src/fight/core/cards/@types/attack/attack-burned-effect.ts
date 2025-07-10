import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { CardStateBurned } from '../state/card-state-burned';

export class BurnedAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'burned';

  constructor(rate: number, level: EffectLevel) {
    this.rate = rate;
    this.level = level;
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (defender.isBurned()) return;

    const burnedState = new CardStateBurned(
      this.level,
      this.computeBurnedTurns(),
      card.actualAttack * this.rate,
    );
    defender.setState(burnedState);

    return { type: this.type, card: defender };
  }

  private computeBurnedTurns() {
    return 2 * this.level - 1;
  }
}
