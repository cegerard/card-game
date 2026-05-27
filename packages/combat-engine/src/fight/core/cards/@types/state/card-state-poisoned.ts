import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';

export class CardStatePoisoned implements CardState {
  public readonly type = 'poison';
  public readonly level: EffectLevel;
  public remainingTurns: number;
  public damageValue: number;
  public readonly terminationEvent?: string;

  constructor(
    level: EffectLevel,
    remainingTurns: number,
    damageValue: number,
    terminationEvent?: string,
  ) {
    this.level = level;
    this.remainingTurns = remainingTurns;
    this.damageValue = damageValue;
    this.terminationEvent = terminationEvent;
  }

  public applyState(card: FightingCard): StateResult {
    if (card.isFrozen) return;

    this.remainingTurns--;
    const damage = card.addRealDamage(this.damageValue);

    return {
      type: 'poison',
      card,
      damage,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }
}
