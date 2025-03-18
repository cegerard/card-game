import { CardState } from './card-state';

export class CardStatePoisoned implements CardState {
  public readonly type = 'poison';
  public remainingTurns: number;
  public damageValue: number;

  constructor(remainingTurns: number, damageValue: number) {
    this.remainingTurns = remainingTurns;
    this.damageValue = damageValue;
  }
}
