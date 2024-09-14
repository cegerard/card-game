import { AttackResult } from './@types/attack-result';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';

export class AttackStage {
  private player1: Player;
  private player2: Player;

  public constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;
  }

  public computeNextAttack(attackingCards: FightingCard[]): AttackResult[] {
    const attacksResults = attackingCards.map((card) => {
      const defensiveCard = this.getTargetedCard(card);
      const { damage, isCritical } = card.attack(defensiveCard);

      const result: AttackResult = {
        attack: {
          attacker: card,
          defender: defensiveCard,
          damage: damage,
          isCritical: isCritical,
        },
      };

      if (defensiveCard.isDead()) {
        this.notifyDeath(defensiveCard);
        result.status_change = {
          card: defensiveCard,
          status: 'dead',
        };
      }

      return result;
    });

    const resultSteps = attacksResults.reduce(
      (acc, result) => {
        acc.attackSteps.push({
          kind: 'attack',
          ...result.attack,
        });

        if (result.status_change) {
          acc.statusChangeSteps.push({
            kind: 'status_change',
            ...result.status_change,
          });
        }

        return acc;
      },
      { attackSteps: [], statusChangeSteps: [] },
    );

    return [...resultSteps.attackSteps, ...resultSteps.statusChangeSteps];
  }

  private getTargetedCard(attacker: FightingCard): FightingCard {
    if (this.player1.ownCard(attacker)) {
      return this.player2.targetedCard(this.player1.cardPosition(attacker));
    }

    return this.player1.targetedCard(this.player2.cardPosition(attacker));
  }

  private notifyDeath(card: FightingCard): void {
    if (this.player1.ownCard(card)) {
      this.player1.notifyDeath(card);
    } else {
      this.player2.notifyDeath(card);
    }
  }
}
