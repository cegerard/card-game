import { FightingCard } from '../../fighting-card';
import { CardState } from './card-state';

export class CardStatePoisoned implements CardState {
  public readonly type = 'poison';
  public remainingTurns: number;
  public damageValue: number;

  constructor(remainingTurns: number, damageValue: number) {
    this.remainingTurns = remainingTurns;
    this.damageValue = damageValue;
  }

  public applyState(card: FightingCard): any {
    this.remainingTurns--;
    const damage = card.addRealDamage(this.damageValue);

    if (this.remainingTurns === 0) {
      card.removeState(this);
    }

    return {
      type: 'poison',
      defender: card,
      damage,
      remainingTurns: this.remainingTurns,
    };
  }
}
