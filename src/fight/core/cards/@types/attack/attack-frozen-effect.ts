import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { CardStateFrozen } from '../state/card-state-frozen';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';

export class FrozenAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'frozen';
  public readonly triggeredDebuff?: EffectTriggeredDebuff;

  constructor(
    rate: number,
    level: EffectLevel,
    triggeredDebuff?: EffectTriggeredDebuff,
  ) {
    this.rate = rate;
    this.level = level;
    this.triggeredDebuff = triggeredDebuff;
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

    const effectResult: EffectResult = { type: this.type, card: defender };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }

  private computeFrozenTurns(effectLevel: EffectLevel): number {
    return 2 * effectLevel - 1;
  }
}
