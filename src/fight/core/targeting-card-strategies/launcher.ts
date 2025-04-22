import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class Launcher implements TargetingCardStrategy {
  public targetedCards(
    source: FightingCard,
    _sourceCardPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    return [source];
  }
}
