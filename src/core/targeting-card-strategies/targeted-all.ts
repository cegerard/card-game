import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedAll implements TargetingCardStrategy {
  public targetedCards(player: Player): FightingCard[] {
    return player.playableCards;
  }
}
