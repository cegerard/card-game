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

  public computeNextAction(cards: FightingCard[]): Step[] {
    const attacksResults = cards.reduce((acc: AttackResult[], card) => {
      if (card.isSpecialReady()) {
        acc.push(this.launchSpecial(card));
      } else {
        acc.push(this.launchAttack(card));
      }

      return acc;
    }, []);

    const resultSteps = this.convertIntoSteps(attacksResults);

    return [...resultSteps.attackSteps, ...resultSteps.statusChangeSteps];
  }

  private launchAttack(card: FightingCard): AttackResult {
    const defensiveCards = this.getTargetedCards(
      card,
      card.simpleAttackTargeting(),
    );

    const result: AttackResult = {
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
    };

    defensiveCards.forEach((defensiveCard) => {
      const damageDealt = card.attack(defensiveCard);

      result.attack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        dodge: damageDealt.dodge,
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

  private launchSpecial(card: FightingCard): AttackResult {
    const targetedCards = this.getTargetedCards(card, card.specialTargeting());

    const result: AttackResult = {
      specialAttack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.resetSpecialEnergy(),
      },
      statusChanges: [],
    };

    targetedCards.forEach((defensiveCard) => {
      const damageDealt = card.launchSpecial(defensiveCard);

      result.specialAttack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        dodge: damageDealt.dodge,
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

  private getTargetedCards(
    sourceCard: FightingCard,
    targetStrategy: TargetingCardStrategy,
  ): FightingCard[] {
    let attacker = this.player1;
    let defender = this.player2;

    if (this.player2.ownCard(sourceCard)) {
      attacker = this.player2;
      defender = this.player1;
    }

    return targetStrategy.targetedCards(sourceCard, attacker, defender);
  }

  private notifyDeath(card: FightingCard): void {
    const player = this.player1.ownCard(card) ? this.player1 : this.player2;

    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(player, card),
    );
  }
}
