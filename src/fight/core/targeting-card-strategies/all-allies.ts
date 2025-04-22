import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class AllAllies implements TargetingCardStrategy {
  public targetedCards(
    source: FightingCard,
    sourceCardPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    return sourceCardPlayer.playableCards.filter(
      (card) =>
        card.identityInfo.deckIdentity !== source.identityInfo.deckIdentity,
    );
  }
}
