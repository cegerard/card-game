import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';

export class CardStateBurned implements CardState {
  public readonly type = 'burn';
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
