import { FightingCard } from '../../fighting-card';

export type StateResult = {
  type: string;
  card: FightingCard;
  damage: number;
  remainingHealth: number;
  remainingTurns: number;
};
