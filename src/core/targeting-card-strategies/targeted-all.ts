import { FightingCard } from '../cards/fighting-card';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedAll implements TargetingCardStrategy {
  public targetedCards(cards: FightingCard[]): FightingCard[] {
    return cards.filter((card) => !card.isDead());
  }
}
