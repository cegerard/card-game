import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class LastAttackerOfAllyTargetingStrategy implements TargetingCardStrategy {
  public readonly id: string = 'last-attacker-of-ally';

  constructor(private readonly allyId: string) {}

  protected attackerOf(ally: FightingCard): FightingCard | undefined {
    return ally.lastAttacker;
  }

  targetedCards(
    attackingCard: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    const ally =
      attackingPlayer.allCards.find((c) => c.id === this.allyId) ??
      defendingPlayer.allCards.find((c) => c.id === this.allyId);
    const attacker = ally && this.attackerOf(ally);
    if (!attacker?.isTargetableBy(attackingCard)) {
      return [];
    }
    return [attacker];
  }
}

/** The card whose attack that ally dodged last: a counter to a miss. */
export class LastDodgedAttackerStrategy extends LastAttackerOfAllyTargetingStrategy {
  public readonly id: string = 'last-dodged-attacker';

  protected attackerOf(ally: FightingCard): FightingCard | undefined {
    return ally.lastDodgedAttacker;
  }
}
