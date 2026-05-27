import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class LastAttackerOfAllyTargetingStrategy implements TargetingCardStrategy {
  public readonly id = 'last-attacker-of-ally';

  constructor(private readonly allyId: string) {}

  targetedCards(
    _attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const ally =
      attackingPlayer.allCards.find((c) => c.id === this.allyId) ??
      defendingPlayer.allCards.find((c) => c.id === this.allyId);
    if (!ally?.lastAttacker || ally.lastAttacker.isDead()) {
      return [];
    }
    return [ally.lastAttacker];
  }
}
