import type { CardInfo } from '@card-game/shared-types';

export type HealingResults = {
  target: CardInfo;
  healAmount: number;
  remainingHealth: number;
}[];
