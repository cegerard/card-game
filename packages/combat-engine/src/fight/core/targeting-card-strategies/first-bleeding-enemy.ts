import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets the first living enemy, in deck order, carrying at least
 * `threshold` bleed stacks; nobody when no enemy bleeds that much.
 */
export class FirstBleedingEnemyStrategy implements TargetingCardStrategy {
  public readonly id = 'first-bleeding-enemy';

  constructor(private readonly threshold: number) {}

  targetedCards(
    _attackingCard: FightingCard,
    _attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const target = defendingPlayer.playableCards.find(
      (card) => card.bleedStacks() >= this.threshold,
    );

    return target ? [target] : [];
  }
}
