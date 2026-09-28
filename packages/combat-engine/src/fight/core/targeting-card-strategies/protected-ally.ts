import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Targets the ally the caster is currently standing in front of.
 *
 * It needs no id and no threshold: the protection itself says who, and its
 * absence says nobody. A skill using it is therefore silent outside the power
 * that opened the protection — which is how a guardian's parting gift reaches
 * exactly the card it was shielding, and only while it was shielding it.
 */
export class ProtectedAllyStrategy implements TargetingCardStrategy {
  public readonly id = 'protected-ally';

  targetedCards(
    attackingCard: FightingCard,
    _attackingPlayer: Player,
    _defendingPlayer: Player,
  ): FightingCard[] {
    const ally = attackingCard.protectedAlly;

    if (!ally || ally.isDead()) return [];

    return [ally];
  }
}
