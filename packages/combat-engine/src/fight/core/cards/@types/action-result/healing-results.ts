import { CardInfo } from '../card-info';

export type HealingResults = {
  target: CardInfo;
  healAmount: number;
  remainingHealth: number;
}[];
