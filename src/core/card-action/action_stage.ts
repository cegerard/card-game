import { AttackReport } from '../fight-simulator/@types/attack-report';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { Step, StepKind } from '../fight-simulator/@types/step';
import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { ActionReport } from '../fight-simulator/@types/action-report';
import { AttackResult } from '../cards/@types/attack-result';
import { HealingReport } from '../fight-simulator/@types/healing-report';
import { HealingResult } from '../cards/@types/healing-result';

type SplittedSteps = {
  actionSteps: Step[];
  statusChangeSteps: Step[];
};

export class ActionStage {
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
    const attacksReports = cards.reduce((acc: ActionReport[], card) => {
      if (card.isSpecialReady()) {
        acc.push(this.launchSpecial(card));
      } else {
        acc.push(this.launchAttack(card));
      }

      return acc;
    }, []);

    const resultSteps = this.convertIntoSteps(attacksReports);

    return [...resultSteps.actionSteps, ...resultSteps.statusChangeSteps];
  }

  private launchAttack(card: FightingCard): AttackReport {
    const defensiveCards = this.getTargetedCards(
      card,
      card.simpleAttackTargeting(),
    );

    const result: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
    };

    defensiveCards.forEach((defensiveCard) => {
      const damageDealt = card.launchAttack(defensiveCard);

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

  private launchSpecial(card: FightingCard): ActionReport {
    const targetedCards = this.getTargetedCards(card, card.specialTargeting());

    if (card.specialKind() === 'specialAttack') {
      return this.computeSpecialAttackResult(card, targetedCards);
    }

    if (card.specialKind() === 'specialHealing') {
      return this.computeSpecialHealingResult(card, targetedCards);
    }

    throw new Error('Unknown special skill');
  }

  private computeSpecialAttackResult(
    card: FightingCard,
    targetedCards: FightingCard[],
  ): AttackReport {
    const result: AttackReport = {
      kind: StepKind.SpecialAttack,
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.resetSpecialEnergy(),
      },
      statusChanges: [],
    };

    targetedCards.forEach((defensiveCard) => {
      const specialResult = card.launchSpecial(defensiveCard) as AttackResult;

      result.attack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: specialResult.damage,
        isCritical: specialResult.isCritical,
        dodge: specialResult.dodge,
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

  private computeSpecialHealingResult(
    card: FightingCard,
    targetedCards: FightingCard[],
  ): ActionReport {
    const result: HealingReport = {
      kind: StepKind.Healing,
      source: card.identityInfo,
      energy: card.resetSpecialEnergy(),
      heal: [],
    };

    targetedCards.forEach((targetedCard) => {
      const healingResult = card.launchSpecial(targetedCard) as HealingResult;

      result.heal.push({
        target: targetedCard.identityInfo,
        healed: healingResult.healed,
        remainingHealth: targetedCard.actualHealth,
      });
    });

    return result;
  }

  private convertIntoSteps(attacksReports: ActionReport[]): SplittedSteps {
    return attacksReports.reduce(
      (acc: SplittedSteps, report) => {
        if (report.kind === 'attack' || report.kind === 'special_attack') {
          acc.actionSteps.push({
            kind: report.kind,
            ...report.attack,
          });

          report.statusChanges.forEach((statusChange) => {
            acc.statusChangeSteps.push({
              kind: StepKind.StatusChange,
              ...statusChange,
            });
          });
        }

        if (report.kind === 'healing') {
          acc.actionSteps.push(report);
        }

        return acc;
      },
      { actionSteps: [], statusChangeSteps: [] },
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
