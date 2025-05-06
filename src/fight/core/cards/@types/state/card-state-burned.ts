import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { CardState } from './card-state';

export class CardStateBurned implements CardState {
  public readonly type = 'burn';
  public remainingTurns: number;
  public damageValue: number;

  constructor(remainingTurns: number, damageValue: number) {
    this.remainingTurns = remainingTurns;
    this.damageValue = damageValue;
  }

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;
    const damage = card.addRealDamage(this.damageValue);

    if (this.remainingTurns === 0) {
      card.removeState(this);
    }

    return {
      type: 'burn',
      card,
      damage,
      remainingTurns: this.remainingTurns,
    };
  }
}
