import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedAll implements TargetingCardStrategy {
  public targetedCards(
    _attackingCard: FightingCard,
    _attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    return defendingPlayer.playableCards;
  }
}
