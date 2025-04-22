import { CardInfo } from 'src/fight/core/cards/@types/card-info';

export type StateEffectReport = {
  type: string;
  card: CardInfo;
  damage: number;
  remainingTurns: number;
  remainingHealth: number;
};
