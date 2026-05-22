import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class AlliedCardByIdStrategy implements TargetingCardStrategy {
  public readonly id = 'allied-card-by-id';

  constructor(private readonly allyId: string) {}

  targetedCards(
    _attackingCard: FightingCard,
    attackingPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    const ally = attackingPlayer.allCards.find((c) => c.id === this.allyId);

    if (!ally || ally.isDead()) {
      return [];
    }

    return [ally];
  }
}
