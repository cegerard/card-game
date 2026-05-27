import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';

export class CardStateStunted implements CardState {
  public readonly type = 'stunt' as const;
  public readonly level: EffectLevel;
  public remainingTurns: number;
  public readonly terminationEvent?: string;

  constructor(
    level: EffectLevel,
    remainingTurns: number,
    terminationEvent?: string,
  ) {
    this.level = level;
    this.remainingTurns = remainingTurns;
    this.terminationEvent = terminationEvent;
  }

  public applyState(card: FightingCard): StateResult {
    this.remainingTurns--;

    return {
      type: 'stunt',
      card,
      damage: 0,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }

  public applyDamageRate(damage: number): number {
    return damage + Math.round(damage * 0.2);
  }
}
