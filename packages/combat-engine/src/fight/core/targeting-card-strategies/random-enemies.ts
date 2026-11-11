import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { Randomizer } from '../randomizer';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Draws `count` distinct enemies the attacker can target, at random, every
 * time it is resolved. Fewer are left: it takes them all. Reported in deck
 * order, whatever the draw order.
 */
export class RandomEnemiesStrategy implements TargetingCardStrategy {
  public readonly id = 'random-enemies';

  constructor(
    private readonly count: number,
    private readonly randomizer: Randomizer,
  ) {
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(
        `RandomEnemiesStrategy count must be an integer >= 1, got ${count}`,
      );
    }
  }

  targetedCards(
    attackingCard: FightingCard,
    _attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const pool = defendingPlayer.playableCards.filter((card) =>
      card.isTargetableBy(attackingCard),
    );
    const drawn: FightingCard[] = [];
    while (drawn.length < this.count && pool.length > 0) {
      const index = Math.floor(this.randomizer.random() * pool.length);
      drawn.push(...pool.splice(index, 1));
    }

    return drawn.sort(
      (a, b) =>
        defendingPlayer.cardPosition(a) - defendingPlayer.cardPosition(b),
    );
  }
}
