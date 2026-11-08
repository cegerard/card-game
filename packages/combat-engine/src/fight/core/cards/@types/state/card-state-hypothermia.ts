import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { CardState } from './card-state';

/**
 * Cold biting a fixed amount at each turn end. Unlike a poison or a bleed,
 * a freeze does not pause it: the cold is what keeps the card frozen.
 */
export class CardStateHypothermia implements CardState {
  public readonly type = 'hypothermia';

  constructor(
    public remainingTurns: number,
    private readonly damageValue: number,
    public readonly terminationEvent?: string,
  ) {}

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;
    const damage = card.addRealDamage(this.damageValue);

    return {
      type: this.type,
      card,
      damage,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }
}
