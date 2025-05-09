import { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';

export interface CardState {
  type: string;
  remainingTurns: number;

  applyState(card: FightingCard): StateResult;
}
