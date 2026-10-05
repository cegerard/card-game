import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedFromPosition implements TargetingCardStrategy {
  public id = 'from-position';

  public targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const attackingCardPosition = attackingPlayer.cardPosition(attackingCard);
    const defendingCards = defendingPlayer.allCards;
    const targetedCard = defendingCards[attackingCardPosition];

    if (!targetedCard || !targetedCard.isTargetable()) {
      // check if there is a targetable card after the missing one and go back to the first targetable card
      const nextCard =
        defendingCards
          .slice(attackingCardPosition + 1)
          .find((c) => c.isTargetable()) ||
        defendingCards
          .slice(0, attackingCardPosition)
          .find((c) => c.isTargetable());

      if (nextCard) {
        return [nextCard];
      }

      return [];
    }

    return [targetedCard];
  }
}
