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
    if (defender.burnLevel >= this.level) return;
    if (defender.frozenLevel > this.level) return;

    if (defender.frozenLevel === this.level) {
      defender.unFreeze();
      return;
    }

    let effectLevel = this.level;
    if (defender.frozenLevel > 0 && defender.frozenLevel < this.level) {
      defender.unFreeze();
      effectLevel = effectLevel - 1;
    }

    const burnedState = new CardStateBurned(
      effectLevel,
      this.computeBurnedTurns(effectLevel),
      card.actualAttack * this.rate,
    );
    defender.setState(burnedState);

    return { type: this.type, card: defender };
  }

  private computeBurnedTurns(effectLevel: EffectLevel) {
    return 2 * effectLevel - 1;
  }
}
