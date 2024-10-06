import { AttackResult } from './@types/attack-result';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { TargetedFromPosition } from '../targeting-card-strategies/targeted-from-position';
import { Step } from '../fight-simulator/@types/step';

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

  public computeNextAttack(attackingCards: FightingCard[]): Step[] {
    const attacksResults = attackingCards.reduce(
      (acc: AttackResult[], card) => {
        if (card.isSpecialAttackReady()) {
          acc.push(...this.specialAttack(card));
        } else {
          acc.push(this.normalAttack(card));
        }

        return acc;
      },
      [],
    );

    const resultSteps = this.convertIntoSteps(attacksResults);

    return [...resultSteps.attackSteps, ...resultSteps.statusChangeSteps];
  }

  private normalAttack(card: FightingCard): AttackResult {
    const defensiveCard = this.getTargetedCards(card)[0];
    const damageDealt = card.attack(defensiveCard);

    const result: AttackResult = {
      attack: {
        attacker: card,
        defender: defensiveCard,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
      },
    };

    if (defensiveCard.isDead()) {
      this.notifyDeath(defensiveCard);
      result.statusChange = {
        card: defensiveCard,
        status: 'dead',
      };
    }

    return result;
  }

  private specialAttack(card: FightingCard): AttackResult[] {
    const defensiveCards = this.getTargetedCards(card);

    return defensiveCards.map((defensiveCard) => {
      const damageDealt = card.launchSpecialAttack(defensiveCard);

      const result: AttackResult = {
        specialAttack: {
          attacker: card,
          defender: defensiveCard,
          damage: damageDealt.damage,
          isCritical: damageDealt.isCritical,
        },
      };

      if (defensiveCard.isDead()) {
        this.notifyDeath(defensiveCard);
        result.statusChange = {
          card: defensiveCard,
          status: 'dead',
        };
      }

      return result;
    });
  }

  private convertIntoSteps(attacksResults: AttackResult[]): {
    attackSteps: Step[];
    statusChangeSteps: Step[];
  } {
    return attacksResults.reduce(
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

        if (result.statusChange) {
          acc.statusChangeSteps.push({
            kind: 'status_change',
            ...result.statusChange,
          });
        }

        return acc;
      },
      { attackSteps: [], statusChangeSteps: [] },
    );
  }

  private getTargetedCards(attacker: FightingCard): FightingCard[] {
    if (this.player1.ownCard(attacker)) {
      return this.targetedCardsByPlayer(attacker, this.player1, this.player2);
    }

    return this.targetedCardsByPlayer(attacker, this.player2, this.player1);
  }

  private targetedCardsByPlayer(
    attacker: FightingCard,
    attackingPlayer: Player,
    defendingPlayer: Player,
  ): FightingCard[] {
    if (attacker.isSpecialAttackReady()) {
      return defendingPlayer.targetedCards(attacker.specialAttackTargeting());
    }

    const targetedStrategy = new TargetedFromPosition(
      attackingPlayer.cardPosition(attacker),
    );
    return defendingPlayer.targetedCards(targetedStrategy);
  }

  private notifyDeath(card: FightingCard): void {
    const player = this.player1.ownCard(card) ? this.player1 : this.player2;

    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(player, card),
    );
  }
}
