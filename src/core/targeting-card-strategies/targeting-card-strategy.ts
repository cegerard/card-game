import { FightingCard } from '../cards/fighting-card';

export interface TargetingCardStrategy {
  targetedCards(cards: FightingCard[]): FightingCard[];
}
