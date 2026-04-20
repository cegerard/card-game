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
import { BuffReport } from '../fight-simulator/@types/buff-report';
import { AttackSkillResults, SkillKind } from '../cards/skills/skill';
import { DeathSkillHandler } from '../fight-simulator/death-skill-handler';

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
  private deathSkillHandler: DeathSkillHandler;

  public constructor(
    player1: Player,
    player2: Player,
    eventBroker: {
      onCardDeath: CardDeathSubscriber[];
    },
    deathSkillHandler: DeathSkillHandler,
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.eventBroker = eventBroker;
    this.deathSkillHandler = deathSkillHandler;
  }

  public computeNextAction(cards: FightingCard[]): Step[] {
    const attacksReports = cards.reduce((acc: ActionReport[], card) => {
      if (card.frozenLevel > 0) return acc;

      card.tickSkills();

      if (card.isSpecialReady()) {
        acc.push(this.launchSpecial(card));
      } else {
        const skillsResults = this.launchNextActionSkills(card);
        if (skillsResults) {
          acc.push(skillsResults);
        } else {
          acc.push(this.launchAttack(card));
        }
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

    this.handleAttackResult(
      card.launchAttack(this.getFightingContext(card)),
      result,
      card,
    );

    return result;
  }

  private launchNextActionSkills(card: FightingCard): AttackReport | null {
    const context = this.getFightingContext(card);
    const skillResults = card.launchSkills('next-action', context);
    const attackSkill = skillResults.find(
      (r): r is AttackSkillResults => r.skillKind === SkillKind.Attack,
    );
    if (!attackSkill) return null;

    const result: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
    };

    this.handleAttackResult(attackSkill.results, result, card);

    return result;
  }

  private launchSpecial(card: FightingCard): ActionReport {
    if (card.specialKind() === 'specialAttack') {
      return this.computeSpecialAttackResult(card);
    }

    if (card.specialKind() === 'specialHealing') {
      return this.computeSpecialHealingResult(card);
    }

    throw new Error(`Unknown special kind: ${card.specialKind()}`);
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

    const specialResults = card.launchSpecial(this.getFightingContext(card));
    const actionResults = specialResults.actionResults as AttackResult[];

    this.handleAttackResult(actionResults, result, card);

    if (specialResults.buffResults.length > 0) {
      const buffReport: BuffReport = {
        kind: StepKind.Buff,
        source: card.identityInfo,
        buffs: specialResults.buffResults.map((buffResult) => ({
          target: buffResult.target,
          kind: buffResult.buff.type,
          value: buffResult.buff.value,
          remainingTurns: buffResult.buff.duration,
        })),
        energy: 0,
      };

      result.buffReport = buffReport;
    }

    return result;
  }

  private computeSpecialHealingResult(card: FightingCard): ActionReport {
    const result: HealingReport = {
      kind: StepKind.Healing,
      source: card.identityInfo,
      energy: card.resetSpecialEnergy(),
      heal: [],
    };

    const specialResults = card.launchSpecial(this.getFightingContext(card));
    const healingResults = specialResults.actionResults as HealingResult[];

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
          } as Step);

          if (report.buffReport) {
            acc.actionSteps.push(report.buffReport);
          }

          report.statusChanges.forEach((statusChange) => {
            acc.statusChangeSteps.push(statusChange);
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

  private handleAttackResult(
    attackResults: AttackResult[],
    report: AttackReport,
    attackerCard?: FightingCard,
  ): void {
    const reportedDeaths = new Set<FightingCard>();

    attackResults.forEach((damageDealt) => {
      const defensiveCard = damageDealt.defender;

      report.attack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        dodge: damageDealt.dodge,
        remainingHealth:
          damageDealt.remainingHealth ?? defensiveCard.actualHealth,
      });

      if (defensiveCard.isDead() && !reportedDeaths.has(defensiveCard)) {
        reportedDeaths.add(defensiveCard);
        this.notifyDeath(defensiveCard, attackerCard);
        report.statusChanges.push({
          kind: StepKind.StatusChange,
          card: defensiveCard.identityInfo,
          status: 'dead',
        });
        report.statusChanges.push(...this.deathSkillHandler.drainSteps());
      } else if (!defensiveCard.isDead() && damageDealt.effect) {
        report.statusChanges.push({
          kind: StepKind.StatusChange,
          status: damageDealt.effect.type,
          card: damageDealt.effect.card.identityInfo,
        });
        if (damageDealt.effect.triggeredDebuff) {
          const { card: debuffTarget, debuff } =
            damageDealt.effect.triggeredDebuff;
          report.statusChanges.push({
            kind: StepKind.Debuff,
            source: attackerCard.identityInfo,
            debuffs: [
              {
                target: debuffTarget.identityInfo,
                kind: debuff.type,
                value: debuff.value,
                remainingTurns: debuff.duration,
              },
            ],
            energy: attackerCard.actualEnergy,
          });
        }
      }
    });
  }

  private getFightingContext(card: FightingCard): FightingContext {
    const isPlayer1CardOwner = this.player1.ownCard(card);
    return {
      sourcePlayer: isPlayer1CardOwner ? this.player1 : this.player2,
      opponentPlayer: isPlayer1CardOwner ? this.player2 : this.player1,
    };
  }

  private notifyDeath(card: FightingCard, killerCard?: FightingCard): void {
    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(card, killerCard),
    );
  }
}
