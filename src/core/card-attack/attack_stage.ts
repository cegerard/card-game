import { AttackResult } from './@types/attack-result';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { Step } from '../fight-simulator/@types/step';
import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';

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
          acc.push(this.specialAttack(card));
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
    const defensiveCards = this.getTargetedCards(card);

    const result: AttackResult = {
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialAttackEnergy(),
      },
      statusChanges: [],
    };

    defensiveCards.forEach((defensiveCard) => {
      const damageDealt = card.attack(defensiveCard);

      result.attack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        remainingHealth: defensiveCard.actualHealth,
      });

      if (defensiveCard.isDead()) {
        this.notifyDeath(defensiveCard);
        result.statusChanges.push({
          card: defensiveCard.identityInfo,
          status: 'dead',
        });
      }
    });

    return result;
  }

  private specialAttack(card: FightingCard): AttackResult {
    const defensiveCards = this.getTargetedCards(card);

    const result: AttackResult = {
      specialAttack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.resetSpecialAttackEnergy(),
      },
      statusChanges: [],
    };

    defensiveCards.forEach((defensiveCard) => {
      const damageDealt = card.launchSpecialAttack(defensiveCard);

      result.specialAttack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        remainingHealth: defensiveCard.actualHealth,
      });

      if (defensiveCard.isDead()) {
        this.notifyDeath(defensiveCard);
        result.statusChanges.push({
          card: defensiveCard.identityInfo,
          status: 'dead',
        });
      }
    });

    return result;
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

        if (result.statusChanges.length > 0) {
          result.statusChanges.forEach((statusChange) => {
            acc.statusChangeSteps.push({
              kind: 'status_change',
              ...statusChange,
            });
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
    let targetedStrategy: TargetingCardStrategy;

    if (attacker.isSpecialAttackReady()) {
      targetedStrategy = attacker.specialAttackTargeting();
    } else {
      targetedStrategy = attacker.simpleAttackTargeting();
    }

    return targetedStrategy.targetedCards(
      attacker,
      attackingPlayer,
      defendingPlayer,
    );
  }

  private notifyDeath(card: FightingCard): void {
    const player = this.player1.ownCard(card) ? this.player1 : this.player2;

    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(player, card),
    );
  }
}
