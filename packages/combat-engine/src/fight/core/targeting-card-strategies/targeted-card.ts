import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class TargetedCard implements TargetingCardStrategy {
  public readonly id = 'targeted-card';

  constructor(private readonly targetCardId: string) {}

  public targetedCards(
    _attackingCard: FightingCard,
    _attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const target = defendingPlayer.allCards.find(
      (card) => card.id === this.targetCardId,
    );

    if (!target || target.isDead()) {
      return [];
    }

    return [target];
  }
}
