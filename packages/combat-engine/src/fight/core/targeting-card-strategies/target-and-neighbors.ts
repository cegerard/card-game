import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets a card chosen at runtime and its immediate neighbors in its deck
 * (positions −1, 0, +1), targetable cards only. Unlike `line-three`, the zone is
 * centered on that card rather than on the attacker position.
 */
export class TargetAndNeighborsStrategy implements TargetingCardStrategy {
  public readonly id = 'target-and-neighbors';

  constructor(private readonly center: FightingCard) {}

  targetedCards(
    _attackingCard: FightingCard,
    _attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    return defendingPlayer
      .threeCardsFromCenter(defendingPlayer.cardPosition(this.center))
      .filter((card) => card.isTargetable());
  }
}
