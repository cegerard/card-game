import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';

export class CardStateBurned implements CardState {
  public readonly type = 'burn';
  public readonly level: EffectLevel;
  public remainingTurns: number;
  public damageValue: number;

  constructor(level: EffectLevel, remainingTurns: number, damageValue: number) {
    this.level = level;
    this.remainingTurns = remainingTurns;
    this.damageValue = damageValue;
  }

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;
    const damage = card.addRealDamage(this.damageValue);

    return {
      type: 'burn',
      card,
      damage,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }
}
