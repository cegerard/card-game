import { FightingCard } from '../cards/fighting-card';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedFromPosition implements TargetingCardStrategy {
  private position: number;

  constructor(position: number) {
    this.position = position;
  }

  public targetedCards(cards: FightingCard[]): FightingCard[] {
    const card = cards[this.position];

    if (card.isDead()) {
      // check if there is a card alive after the dead card and go back to the first alive card
      const nextCard =
        cards.slice(this.position + 1).find((c) => !c.isDead()) ||
        cards.slice(0, this.position).find((c) => !c.isDead());

      if (nextCard) {
        return [nextCard];
      }

      return [];
    }

    return [card];
  }
}
