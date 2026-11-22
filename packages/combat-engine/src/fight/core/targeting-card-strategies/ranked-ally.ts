import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets the caster's living ally ranking first on a measure read live at
 * launch (buffs included), the caster excluded; ties keep deck order. Like
 * `protected-ally` it still resolves when the caster is dead, which is what a
 * legacy left on death needs.
 */
abstract class RankedAllyStrategy implements TargetingCardStrategy {
  public abstract readonly id: string;

  /** The ally scoring highest is targeted. */
  protected abstract score(card: FightingCard): number;

  targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    const first = attackingPlayer.allCards
      .filter((card) => card !== attackingCard && !card.isDead())
      .reduce<FightingCard | undefined>(
        (best, card) =>
          !best || this.score(card) > this.score(best) ? card : best,
        undefined,
      );

    return first ? [first] : [];
  }
}

export class FastestAllyStrategy extends RankedAllyStrategy {
  public readonly id = 'fastest-ally';

  protected score(card: FightingCard): number {
    return card.actualSpeed;
  }
}

export class StrongestAllyStrategy extends RankedAllyStrategy {
  public readonly id = 'strongest-ally';

  protected score(card: FightingCard): number {
    return card.actualAttack;
  }
}

/** Unlike `lowest-health-ally`, compares health points rather than ratios. */
export class LowestHealthPointsAllyStrategy extends RankedAllyStrategy {
  public readonly id = 'lowest-health-points-ally';

  protected score(card: FightingCard): number {
    return -card.actualHealth;
  }
}
