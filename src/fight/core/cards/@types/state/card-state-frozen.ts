import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { CardState } from './card-state';

export class CardStateFrozen implements CardState {
  public readonly type = 'freeze';
  public remainingTurns: number;
  private damageRate: number;

  constructor(remainingTurns: number, damageRate: number) {
    this.remainingTurns = remainingTurns;
    this.damageRate = damageRate;
  }

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;

    if (this.remainingTurns === 0) {
      card.removeState(this);
    }

    return {
      type: 'freeze',
      card,
      damage: 0,
      remainingTurns: this.remainingTurns,
    };
  }

  public applyDamageRate(damage: number): number {
    return damage + Math.round(damage * this.damageRate);
  }
}
