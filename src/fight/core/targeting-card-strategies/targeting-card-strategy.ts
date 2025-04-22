import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';

export interface TargetingCardStrategy {
  targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[];
}
