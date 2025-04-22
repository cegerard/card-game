import { FightingCard } from '../../fighting-card';

export type StateResult = {
  type: string;
  card: FightingCard;
  damage: number;
  remainingTurns: number;
};
