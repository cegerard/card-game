import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { CardStateFrozen } from '../state/card-state-frozen';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';

export class FrozenAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'frozen';

  constructor(rate: number, level: EffectLevel) {
    this.rate = rate;
    this.level = level;
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (defender.isFrozen()) return;

    const frozenState = new CardStateFrozen(
      this.level,
      this.computeFrozenTurns(),
      this.rate,
    );
    defender.setState(frozenState);

    return { type: this.type, card: defender };
  }

  private computeFrozenTurns() {
    return 2 * this.level - 1;
  }
}
