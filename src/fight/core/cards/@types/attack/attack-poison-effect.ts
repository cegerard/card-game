import { FightingCard } from '../../fighting-card';
import { AttackEffect, EffectResult } from './attack-effect';
import { CardStatePoisoned } from '../state/card-state-poisoned';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { round2 } from '../../../../tools/round';

export class PoisonAttackEffect implements AttackEffect {
  public readonly rate: number;
  public readonly level: EffectLevel;
  public readonly type = 'poison' as const;
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
    if (defender.frozenLevel > 0) return;
    if (defender.poisonLevel >= this.level) return;

    const poisonedState = new CardStatePoisoned(
      this.level,
      this.computePoisonedTurns(),
      round2(card.actualAttack * this.rate),
      this.terminationEvent,
    );
    defender.setState(poisonedState);

    const effectResult: EffectResult = { type: this.type, card: defender };
    const appliedDebuff = this.triggeredDebuff?.tryApply(defender);
    if (appliedDebuff) {
      effectResult.triggeredDebuff = { card: defender, debuff: appliedDebuff };
    }
    return effectResult;
  }

  private computePoisonedTurns() {
    return 2 * this.level - 1;
  }
}
