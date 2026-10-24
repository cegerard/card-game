import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets the caster's living ally with the highest speed, buffs included,
 * the caster excluded; ties keep deck order. Like `protected-ally` it still
 * resolves when the caster is dead, which is what a legacy left on death needs.
 */
export class FastestAllyStrategy implements TargetingCardStrategy {
  public readonly id = 'fastest-ally';

  targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    const fastest = attackingPlayer.allCards
      .filter((card) => card !== attackingCard && !card.isDead())
      .reduce<FightingCard | undefined>(
        (best, card) =>
          !best || card.actualSpeed > best.actualSpeed ? card : best,
        undefined,
      );

    return fastest ? [fastest] : [];
  }
}
