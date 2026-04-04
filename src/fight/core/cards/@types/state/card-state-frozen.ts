import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';

export class CardStateFrozen implements CardState {
  public readonly type = 'freeze';
  public readonly level: EffectLevel;
  public remainingTurns: number;
  private damageRate: number;
  public readonly terminationEvent?: string;

  constructor(
    level: EffectLevel,
    remainingTurns: number,
    damageRate: number,
    terminationEvent?: string,
  ) {
    this.level = level;
    this.remainingTurns = remainingTurns;
    this.damageRate = damageRate;
    this.terminationEvent = terminationEvent;
  }

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;

    return {
      type: 'freeze',
      card,
      damage: 0,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }

  public applyDamageRate(damage: number): number {
    return damage + Math.round(damage * this.damageRate);
  }
}
