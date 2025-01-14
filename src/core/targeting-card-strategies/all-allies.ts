import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class AllOwnerCards implements TargetingCardStrategy {
  public targetedCards(
    _source: FightingCard,
    sourceCardPlayer: Player,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _defendingPlayer: Player,
  ): FightingCard[] {
    return sourceCardPlayer.playableCards;
  }
}
