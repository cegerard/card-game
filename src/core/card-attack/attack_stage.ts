import { AttackResult } from './@types/attack-result';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { TargetedFromPosition } from '../targeting-card-strategies/targeted-from-position';

export class AttackStage {
  private player1: Player;
  private player2: Player;
  private eventBroker: {
    onCardDeath: CardDeathSubscriber[];
  };

  public constructor(
    player1: Player,
    player2: Player,
    eventBroker: {
      onCardDeath: CardDeathSubscriber[];
    },
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.eventBroker = eventBroker;
  }

  public computeNextAttack(attackingCards: FightingCard[]): any[] {
    const attacksResults = attackingCards.map((card) => {
      let damage: number;
      let isCritical: boolean;
      let result: AttackResult;
      const defensiveCard = this.getTargetedCard(card);

      if (card.isSpecialAttackReady()) {
        const damageDealt = card.launchSpecialAttack(defensiveCard);
        damage = damageDealt.damage;
        isCritical = damageDealt.isCritical;
        result = {
          specialAttack: {
            attacker: card,
            defender: defensiveCard,
            damage: damage,
            isCritical: isCritical,
          },
        };
      } else {
        const damageDealt = card.attack(defensiveCard);
        damage = damageDealt.damage;
        isCritical = damageDealt.isCritical;
        result = {
          attack: {
            attacker: card,
            defender: defensiveCard,
            damage: damage,
            isCritical: isCritical,
          },
        };
      }

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
        if ('attack' in result) {
          acc.attackSteps.push({
            kind: 'attack',
            ...result.attack,
          });
        }

        if ('specialAttack' in result) {
          acc.attackSteps.push({
            kind: 'special_attack',
            ...result.specialAttack,
          });
        }

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
      const targetedStrategy = new TargetedFromPosition(
        this.player1.cardPosition(attacker),
      );
      return this.player2.targetedCard(targetedStrategy)[0];
    }

    const targetedStrategy = new TargetedFromPosition(
      this.player2.cardPosition(attacker),
    );
    return this.player1.targetedCard(targetedStrategy)[0];
  }

  private notifyDeath(card: FightingCard): void {
    const player = this.player1.ownCard(card) ? this.player1 : this.player2;

    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(player, card),
    );
  }
}
