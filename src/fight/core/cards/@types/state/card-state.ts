import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { StateEffectType } from './state-effect-type';

export interface CardState {
  type: StateEffectType;
  level: EffectLevel;
  remainingTurns: number;
  terminationEvent?: string;

  applyState(card: FightingCard): StateResult;
}
