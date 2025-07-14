import { AttackReport } from '../fight-simulator/@types/attack-report';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { Step, StepKind } from '../fight-simulator/@types/step';
import { ActionReport } from '../fight-simulator/@types/action-report';
import { AttackResult } from '../cards/@types/action-result/attack-result';
import { HealingReport } from '../fight-simulator/@types/healing-report';
import { HealingResult } from '../cards/@types/action-result/healing-result';
import { FightingContext } from '../cards/@types/fighting-context';

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
      if (card.frozenLevel > 0) return acc;

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
    const result: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
    };

    card.launchAttack(this.getFightingContext(card)).forEach((damageDealt) => {
      const defensiveCard = damageDealt.defender;

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
      } else if (damageDealt.effect) {
        result.statusChanges.push({
          status: damageDealt.effect.type,
          card: damageDealt.effect.card.identityInfo,
        });
      }
    });

    return result;
  }

  private launchSpecial(card: FightingCard): ActionReport {
    if (card.specialKind() === 'specialAttack') {
      return this.computeSpecialAttackResult(card);
    }

    return this.computeSpecialHealingResult(card);
  }

  private computeSpecialAttackResult(card: FightingCard): AttackReport {
    const result: AttackReport = {
      kind: StepKind.SpecialAttack,
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.resetSpecialEnergy(),
      },
      statusChanges: [],
    };

    const specialResults = card.launchSpecial(
      this.getFightingContext(card),
    ) as AttackResult[];
    specialResults.forEach((specialResult) => {
      const targetedCard = specialResult.defender;
      result.attack.damages.push({
        defender: targetedCard.identityInfo,
        damage: specialResult.damage,
        isCritical: specialResult.isCritical,
        dodge: specialResult.dodge,
        remainingHealth: targetedCard.actualHealth,
      });

      if (targetedCard.isDead()) {
        this.notifyDeath(targetedCard);
        result.statusChanges.push({
          card: targetedCard.identityInfo,
          status: 'dead',
        });
      }

      if (specialResult.effect) {
        result.statusChanges.push({
          status: specialResult.effect.type,
          card: specialResult.effect.card.identityInfo,
        });
      }
    });

    return result;
  }

  private computeSpecialHealingResult(card: FightingCard): ActionReport {
    const result: HealingReport = {
      kind: StepKind.Healing,
      source: card.identityInfo,
      energy: card.resetSpecialEnergy(),
      heal: [],
    };

    const healingResults = card.launchSpecial(
      this.getFightingContext(card),
    ) as HealingResult[];

    healingResults.forEach((healingResult) => {
      result.heal.push({
        target: healingResult.target.identityInfo,
        healed: healingResult.healed,
        remainingHealth: healingResult.target.actualHealth,
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

  private getFightingContext(card: FightingCard): FightingContext {
    const isPlayer1CardOwner = this.player1.ownCard(card);
    return {
      sourcePlayer: isPlayer1CardOwner ? this.player1 : this.player2,
      opponentPlayer: isPlayer1CardOwner ? this.player2 : this.player1,
    };
  }

  private notifyDeath(card: FightingCard): void {
    const player = this.player1.ownCard(card) ? this.player1 : this.player2;

    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(player, card),
    );
  }
}
