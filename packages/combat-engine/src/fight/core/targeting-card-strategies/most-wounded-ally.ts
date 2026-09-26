import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets the ally in the worst shape, among those below a health threshold.
 * Unlike `AlliedCardByIdStrategy` the target is not named up front: it is
 * resolved against the live board each time the skill launches, which is what
 * a guardian power needs when the deck is composed by the player.
 *
 * The caster is never its own target — a card protecting itself is a different
 * mechanic, already served by monitoring its own id. Returns nothing when no
 * ally is below the threshold, so the skill stays silent on a healthy team.
 */
export class MostWoundedAllyStrategy implements TargetingCardStrategy {
  public readonly id = 'most-wounded-ally';

  constructor(private readonly threshold: number) {}

  targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    const candidates = attackingPlayer.allCards.filter(
      (card) =>
        card !== attackingCard &&
        !card.isDead() &&
        card.healthRatio < this.threshold,
    );

    if (candidates.length === 0) return [];

    // Ties keep the first candidate, so deck order decides and the choice
    // stays reproducible from one run to the next.
    return [
      candidates.reduce((worst, card) =>
        card.healthRatio < worst.healthRatio ? card : worst,
      ),
    ];
  }
}
