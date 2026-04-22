import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { CardStateBurned } from '../state/card-state-burned';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { roundTo2 } from '../../../../tools/round';

export class BurnAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'burn' as const;
  public readonly triggeredDebuff?: EffectTriggeredDebuff;
  public readonly terminationEvent?: string;

  constructor(
    rate: number,
    level: EffectLevel,
    triggeredDebuff?: EffectTriggeredDebuff,
    terminationEvent?: string,
  ) {
    this.rate = rate;
    this.level = level;
    this.triggeredDebuff = triggeredDebuff;
    this.terminationEvent = terminationEvent;
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
      roundTo2(card.actualAttack * this.rate),
      this.terminationEvent,
    );
    defender.setState(burnedState);

    const effectResult: EffectResult = { type: this.type, card: defender };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }

  private computeBurnedTurns(effectLevel: EffectLevel) {
    return 2 * effectLevel - 1;
  }
}
