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
    if (defender.frozenLevel >= this.level) return;
    if (defender.burnLevel > this.level) return;

    if (defender.burnLevel === this.level) {
      defender.unBurn();
      return;
    }

    let effectLevel = this.level;
    if (defender.burnLevel > 0 && defender.burnLevel < this.level) {
      defender.unBurn();
      effectLevel = effectLevel - 1;
    }

    const frozenState = new CardStateFrozen(
      effectLevel,
      this.computeFrozenTurns(effectLevel),
      this.rate,
    );
    defender.setState(frozenState);

    return { type: this.type, card: defender };
  }

  private computeFrozenTurns(effectLevel: EffectLevel): number {
    return 2 * effectLevel - 1;
  }
}
