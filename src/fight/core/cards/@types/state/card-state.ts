import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';

export interface CardState {
  type: string;
  level: EffectLevel;
  remainingTurns: number;
  terminationEvent?: string;

  applyState(card: FightingCard): StateResult;
}
