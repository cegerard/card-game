import { FightingCard } from '../../fighting-card';

export interface CardState {
  type: string;
  remainingTurns: number;
  damageValue: number;

  applyState(card: FightingCard): any;
}
