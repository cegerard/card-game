import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';

export interface TargetingCardStrategy {
  targetedCards(player: Player): FightingCard[];
}
