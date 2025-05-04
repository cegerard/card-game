import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { CardStatePoisoned } from '../state/card-state-poisoned';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';

export class PoisonedAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'poisoned';

  constructor(rate: number, level: EffectLevel) {
    this.rate = rate;
    this.level = level;
  }

  public applyEffect(
    defender: FightingCard,
    card: FightingCard,
    _context: FightingContext,
  ): EffectResult {
    if (defender.isPoisoned()) return;

    const poisonedState = new CardStatePoisoned(
      this.computePoisonedTurns(),
      card.actualAttack * this.rate,
    );
    defender.setState(poisonedState);

    return { type: this.type, card: defender };
  }

  private computePoisonedTurns() {
    return 2 * this.level - 1;
  }
}
