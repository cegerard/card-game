import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedLineThree implements TargetingCardStrategy {
  public id = 'line-three';

  public targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const attackingCardPosition = attackingPlayer.cardPosition(attackingCard);
    const defendingCards = defendingPlayer.threeCardsFromCenter(
      attackingCardPosition,
    );

    return defendingCards.filter((card) => !card.isDead());
  }
}
