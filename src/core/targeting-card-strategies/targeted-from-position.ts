import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedFromPosition implements TargetingCardStrategy {
  public targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const attackingCardPosition = attackingPlayer.cardPosition(attackingCard);
    const defendingCards = defendingPlayer.allCards;
    const targetedCard = defendingCards[attackingCardPosition];

    if (targetedCard.isDead()) {
      // check if there is a card alive after the dead card and go back to the first alive card
      const nextCard =
        defendingCards
          .slice(attackingCardPosition + 1)
          .find((c) => !c.isDead()) ||
        defendingCards.slice(0, attackingCardPosition).find((c) => !c.isDead());

      if (nextCard) {
        return [nextCard];
      }

      return [];
    }

    return [targetedCard];
  }
}
