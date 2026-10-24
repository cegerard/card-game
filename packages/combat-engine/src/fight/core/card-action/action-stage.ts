import { defendersKilled } from '../fight-simulator/defenders-killed';
import { AttackReport } from '../fight-simulator/@types/attack-report';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from '../fight-simulator/card-death-subscriber';
import { Step, StepKind } from '../fight-simulator/@types/step';
import {
  ActionReport,
  SKILL_STEPS,
  SkillStepsActionReport,
} from '../fight-simulator/@types/action-report';
import { AttackResult } from '../cards/@types/action-result/attack-result';
import { HealingReport } from '../fight-simulator/@types/healing-report';
import { HealingResult } from '../cards/@types/action-result/healing-result';
import { FightingContext } from '../cards/@types/fighting-context';
import { DebuffReport } from '../fight-simulator/@types/alteration-report';
import {
  BuffResult,
  DebuffResult,
} from '../cards/@types/action-result/alteration-result';
import {
  AttackSkillResults,
  SkillKind,
  SkillResults,
} from '../cards/skills/skill';
import { DeathSkillHandler } from '../fight-simulator/death-skill-handler';
import { ShieldResult } from '../cards/@types/action-result/shield-result';
import { ShieldAppliedReport } from '../fight-simulator/@types/shield-report';
import { triggerReactiveSkills } from '../fight-simulator/reactive-skill-checker';
import {
  hitAlterationResults,
  skillResultsToSteps,
} from '../fight-simulator/skill-results-to-steps';
import { effectResultsToSteps } from '../fight-simulator/effect-results-to-steps';
import { EndEventProcessor } from '../fight-simulator/end-event-processor';
import { executionSteps } from '../fight-simulator/execution-steps';
import { ExecutionResult } from '../cards/@types/action-result/execution-result';
import { SurvivedReport } from '../fight-simulator/@types/survived-report';
import { BLEED_STACKS_APPLIED } from '../trigger/bleed-stacks-applied';
import { TURN_START } from '../trigger/turn-start';
import { SpecialStanceActionReport } from '../fight-simulator/@types/special-stance-report';
import { SpecialResult } from '../cards/@types/action-result/special-result';
import {
  concealmentStartedReport,
  revealAttacker,
} from '../fight-simulator/concealment-steps';
import {
  stanceEndedReport,
  stanceStartedReport,
} from '../fight-simulator/stance-steps';

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
  private endEventProcessor?: EndEventProcessor;

  public constructor(
    player1: Player,
    player2: Player,
    eventBroker: {
      onCardDeath: CardDeathSubscriber[];
    },
    deathSkillHandler: DeathSkillHandler,
    endEventProcessor?: EndEventProcessor,
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.eventBroker = eventBroker;
    this.deathSkillHandler = deathSkillHandler;
    this.endEventProcessor = endEventProcessor;
  }

  public computeNextAction(cards: FightingCard[]): Step[] {
    const attacksReports = cards.reduce((acc: ActionReport[], card) => {
      if (card.frozenLevel > 0 || card.isStunted) return acc;

      card.beginAction();
      card.tickSkills();

      acc.push(...this.launchTurnStartSkills(card));

      if (card.isSpecialReady()) {
        acc.push(this.launchSpecial(card));
      } else {
        const skillsResults = this.launchNextActionSkills(card);
        if (skillsResults) {
          acc.push(...skillsResults);
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
    const attackResults = card.launchAttack(this.getFightingContext(card));
    const report: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        name: attackResults.name,
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
      survivedSteps: [],
      concealmentEndedReports: [],
    };

    this.handleAttackResult(attackResults.results, report, card);

    return report;
  }

  private launchNextActionSkills(card: FightingCard): ActionReport[] | null {
    const context = this.getFightingContext(card);
    const skillResults = card.launchSkills('next-action', context);
    const attackSkill = skillResults.find(
      (r): r is AttackSkillResults => r.skillKind === SkillKind.Attack,
    );
    if (!attackSkill) {
      const dive = this.diveReport(card, skillResults);
      return dive && [dive];
    }

    const result: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        name: attackSkill.name,
        attacker: card.identityInfo,
        damages: [],
        energy: card.increaseSpecialEnergy(),
      },
      statusChanges: [],
      survivedSteps: [],
      concealmentEndedReports: [],
    };

    this.handleAttackResult(attackSkill.results, result, card);
    result.precedingSteps = skillResultsToSteps(
      card,
      skillResults.filter((r) => r.skillKind === SkillKind.Concealment),
    );
    result.executionSteps = this.executionReport(
      card,
      attackSkill.name,
      attackSkill.executions?.results ?? [],
    );
    result.hitAlterationSteps = skillResultsToSteps(
      card,
      hitAlterationResults(attackSkill),
    );
    this.attachStanceReports(card, attackSkill, result);
    result.endEventSteps = this.endEventSteps(card, attackSkill);
    if (attackSkill.lowHealthDebuff) {
      result.debuffReport = this.buildDebuffReport(
        card,
        attackSkill.lowHealthDebuff.name,
        attackSkill.lowHealthDebuff.results,
      );
    }

    return [
      result,
      ...(attackSkill.splash?.results.length > 0
        ? [this.reportStrike(card, attackSkill.splash)]
        : []),
    ];
  }

  /** What an exhausted skill lets go of: its event-bound buffs and effects. */
  private endEventSteps(card: FightingCard, skill: SkillResults): Step[] {
    if (!skill.endEvent || !this.endEventProcessor) return [];

    return this.endEventProcessor.processEndEvent(
      skill.endEvent,
      card.identityInfo,
      skill.powerId,
    );
  }

  private attachStanceReports(
    card: FightingCard,
    attackSkill: AttackSkillResults,
    report: AttackReport,
  ): void {
    if (attackSkill.stanceStarted) {
      report.stanceStartedReport = stanceStartedReport(
        card,
        attackSkill.stanceStarted,
      );
    }
    if (attackSkill.stanceEnded) {
      report.stanceEndedReport = stanceEndedReport(
        card,
        attackSkill.stanceEnded,
      );
    }
  }

  /**
   * A concealment fired on `next-action` takes the action instead of the
   * attack: the card dives out of sight and strikes nobody this turn.
   */
  private diveReport(
    card: FightingCard,
    skillResults: SkillResults[],
  ): SkillStepsActionReport | null {
    const dive = skillResults.find(
      (r) => r.skillKind === SkillKind.Concealment,
    );
    if (!dive) return null;

    return { kind: SKILL_STEPS, steps: skillResultsToSteps(card, [dive]) };
  }

  /**
   * Attacks fired at the start of the card turn, before its own action and
   * its special check. They add to the action rather than replace it, and an
   * attack that struck nobody reports nothing.
   */
  private launchTurnStartSkills(card: FightingCard): AttackReport[] {
    return card
      .launchSkills(TURN_START, this.getFightingContext(card))
      .filter(
        (r): r is AttackSkillResults =>
          r.skillKind === SkillKind.Attack && r.results.length > 0,
      )
      .flatMap((attackSkill) => {
        const reports = [attackSkill, attackSkill.splash]
          .filter((strike) => strike?.results.length > 0)
          .map((strike) => this.reportStrike(card, strike));
        reports[0].executionSteps = this.executionReport(
          card,
          attackSkill.name,
          attackSkill.executions?.results ?? [],
        );
        reports[0].hitAlterationSteps = skillResultsToSteps(
          card,
          hitAlterationResults(attackSkill),
        );
        this.attachStanceReports(card, attackSkill, reports[0]);
        reports[0].endEventSteps = this.endEventSteps(card, attackSkill);
        if (attackSkill.lowHealthDebuff) {
          reports[0].debuffReport = this.buildDebuffReport(
            card,
            attackSkill.lowHealthDebuff.name,
            attackSkill.lowHealthDebuff.results,
          );
        }

        return reports;
      });
  }

  private reportStrike(
    card: FightingCard,
    strike: { name?: string; results: AttackResult[] },
  ): AttackReport {
    const report: AttackReport = {
      kind: StepKind.Attack,
      attack: {
        name: strike.name,
        attacker: card.identityInfo,
        damages: [],
        energy: card.actualEnergy,
      },
      statusChanges: [],
      survivedSteps: [],
      concealmentEndedReports: [],
    };
    this.handleAttackResult(strike.results, report, card);

    return report;
  }

  private launchSpecial(card: FightingCard): ActionReport {
    if (card.specialKind() === 'specialAttack') {
      return this.computeSpecialAttackResult(card);
    }

    if (card.specialKind() === 'specialHealing') {
      return this.computeSpecialHealingResult(card);
    }

    if (card.specialKind() === 'specialStance') {
      return this.computeSpecialStanceResult(card);
    }

    throw new Error(`Unknown special kind: ${card.specialKind()}`);
  }

  private computeSpecialAttackResult(card: FightingCard): AttackReport {
    const specialResults = card.launchSpecial(this.getFightingContext(card));
    const result: AttackReport = {
      kind: StepKind.SpecialAttack,
      attack: {
        name: specialResults.name,
        attacker: card.identityInfo,
        damages: [],
        energy: card.resetSpecialEnergy(specialResults.energyRefund),
      },
      statusChanges: [],
      survivedSteps: [],
      concealmentEndedReports: [],
    };
    const actionResults = specialResults.actionResults as AttackResult[];

    this.handleAttackResult(actionResults, result, card);
    result.executionSteps = this.executionReport(
      card,
      specialResults.name,
      specialResults.executions ?? [],
    );

    Object.assign(result, this.specialSideReports(card, specialResults));

    return result;
  }

  private computeSpecialStanceResult(
    card: FightingCard,
  ): SpecialStanceActionReport {
    const specialResults = card.launchSpecial(this.getFightingContext(card));
    const {
      stanceStartedReport,
      buffReport,
      debuffReport,
      shieldAppliedReport,
    } = this.specialSideReports(card, specialResults);
    return {
      kind: StepKind.SpecialStance,
      step: {
        kind: StepKind.SpecialStance,
        name: specialResults.name,
        caster: card.identityInfo,
        energy: card.resetSpecialEnergy(),
      },
      followUps: [
        stanceStartedReport,
        buffReport,
        debuffReport,
        shieldAppliedReport,
        specialResults.concealmentStarted &&
          concealmentStartedReport(card, specialResults.concealmentStarted),
      ].filter((step) => step !== undefined),
    };
  }

  /** The steps a special brings on top of its hits or heals. */
  private specialSideReports(
    card: FightingCard,
    specialResults: SpecialResult,
  ): Pick<
    AttackReport,
    | 'buffReport'
    | 'debuffReport'
    | 'shieldAppliedReport'
    | 'stanceStartedReport'
  > {
    const buffs = specialResults.alterationResults.filter(
      (r): r is BuffResult => r.alteration.polarity === 'buff',
    );
    const debuffs = specialResults.alterationResults.filter(
      (r): r is DebuffResult => r.alteration.polarity === 'debuff',
    );

    return {
      buffReport:
        buffs.length > 0
          ? {
              kind: StepKind.Buff,
              name: specialResults.name,
              source: card.identityInfo,
              alterations: buffs.map((buffResult) => ({
                target: buffResult.target,
                kind: buffResult.alteration.type,
                value: buffResult.alteration.value,
                remainingTurns: buffResult.alteration.duration,
              })),
              energy: 0,
            }
          : undefined,
      debuffReport:
        debuffs.length > 0
          ? this.buildDebuffReport(card, specialResults.name, debuffs)
          : undefined,
      shieldAppliedReport:
        specialResults.shieldResults.length > 0
          ? this.buildShieldAppliedReport(
              card,
              specialResults.name,
              specialResults.shieldResults,
            )
          : undefined,
      stanceStartedReport:
        specialResults.stanceStarted &&
        stanceStartedReport(card, specialResults.stanceStarted),
    };
  }

  private computeSpecialHealingResult(card: FightingCard): ActionReport {
    const specialResults = card.launchSpecial(this.getFightingContext(card));
    const result: HealingReport = {
      kind: StepKind.Healing,
      name: specialResults.name,
      source: card.identityInfo,
      energy: card.resetSpecialEnergy(),
      heal: [],
    };
    const healingResults = specialResults.actionResults as HealingResult[];

    healingResults.forEach((healingResult) => {
      result.heal.push({
        target: healingResult.target.identityInfo,
        healed: healingResult.healed,
        remainingHealth: healingResult.remainingHealth,
      });
    });

    return result;
  }

  private convertIntoSteps(attacksReports: ActionReport[]): SplittedSteps {
    return attacksReports.reduce(
      (acc: SplittedSteps, report) => {
        if (report.kind === 'attack' || report.kind === 'special_attack') {
          acc.actionSteps.push(...(report.precedingSteps ?? []));
          acc.actionSteps.push({
            kind: report.kind,
            ...report.attack,
          } as Step);
          acc.actionSteps.push(...(report.executionSteps ?? []));
          acc.actionSteps.push(...report.concealmentEndedReports);
          acc.actionSteps.push(...(report.hitAlterationSteps ?? []));

          if (report.buffReport) {
            acc.actionSteps.push(report.buffReport);
          }

          if (report.debuffReport) {
            acc.actionSteps.push(report.debuffReport);
          }

          if (report.shieldAppliedReport) {
            acc.actionSteps.push(report.shieldAppliedReport);
          }

          if (report.stanceStartedReport) {
            acc.actionSteps.push(report.stanceStartedReport);
          }

          if (report.stanceEndedReport) {
            acc.actionSteps.push(report.stanceEndedReport);
          }

          acc.actionSteps.push(...(report.endEventSteps ?? []));

          report.survivedSteps.forEach((step) => {
            acc.actionSteps.push(step);
          });

          report.statusChanges.forEach((statusChange) => {
            acc.statusChangeSteps.push(statusChange);
          });
        }

        if (report.kind === 'healing') {
          acc.actionSteps.push(report);
        }

        if (report.kind === StepKind.SpecialStance) {
          acc.actionSteps.push(report.step, ...report.followUps);
        }

        if (report.kind === SKILL_STEPS) {
          acc.actionSteps.push(...report.steps);
        }

        return acc;
      },
      { actionSteps: [], statusChangeSteps: [] },
    );
  }

  private handleAttackResult(
    attackResults: AttackResult[],
    report: AttackReport,
    attackerCard: FightingCard,
  ): void {
    if (attackResults.length > 0) {
      report.concealmentEndedReports.push(...revealAttacker(attackerCard));
    }
    const reportedDeaths = new Set<FightingCard>();
    let stolenLife = 0;

    attackResults.forEach((damageDealt) => {
      if (!damageDealt.dodge && attackerCard.hasLifesteal) {
        stolenLife += attackerCard.stealLife();
      }

      const defensiveCard = damageDealt.defender;

      report.attack.damages.push({
        defender: defensiveCard.identityInfo,
        damage: damageDealt.damage,
        isCritical: damageDealt.isCritical,
        dodge: damageDealt.dodge,
        remainingHealth: damageDealt.remainingHealth,
        kind: damageDealt.kind,
        shieldAbsorbed: damageDealt.shieldAbsorbed,
        consumedBleedStacks: damageDealt.consumedBleedStacks,
      });

      if (damageDealt.interceptedFor) {
        report.statusChanges.push({
          kind: StepKind.AttackIntercepted,
          card: defensiveCard.identityInfo,
          protectedCard: damageDealt.interceptedFor.identityInfo,
        });
      }

      if (damageDealt.mitigated) {
        report.statusChanges.push({
          kind: StepKind.DamageMitigated,
          name: damageDealt.mitigatedSkillName,
          card: defensiveCard.identityInfo,
        });
      }

      if (damageDealt.shieldBroken) {
        report.statusChanges.push({
          kind: StepKind.ShieldBroken,
          card: defensiveCard.identityInfo,
        });
      }

      if (damageDealt.survived) {
        const survivedReport: SurvivedReport = {
          kind: StepKind.Survived,
          name: damageDealt.survivedSkillName,
          card: defensiveCard.identityInfo,
        };
        report.survivedSteps.push(survivedReport);
        report.survivedSteps.push(...this.survivedReactions(defensiveCard));
      }

      if (defensiveCard.isDead() && !reportedDeaths.has(defensiveCard)) {
        reportedDeaths.add(defensiveCard);
        this.notifyDeath(defensiveCard, attackerCard);
        report.statusChanges.push({
          kind: StepKind.StatusChange,
          card: defensiveCard.identityInfo,
          status: 'dead',
        });
        report.statusChanges.push(...this.deathSkillHandler.drainSteps());
      } else if (!defensiveCard.isDead()) {
        if (!damageDealt.dodge) {
          defensiveCard.lastAttacker = attackerCard;
          report.statusChanges.push(
            ...this.dispatchDamageReactions(defensiveCard, attackerCard),
          );
        }
        report.statusChanges.push(
          ...effectResultsToSteps(attackerCard, damageDealt.effects),
        );
        const reactiveResults = triggerReactiveSkills(
          defensiveCard,
          this.getFightingContext(defensiveCard),
        );
        report.statusChanges.push(
          ...skillResultsToSteps(defensiveCard, reactiveResults),
        );
      }
    });

    if (stolenLife > 0) {
      report.statusChanges.push({
        kind: StepKind.Healing,
        name: attackerCard.lifestealName,
        source: attackerCard.identityInfo,
        heal: [
          {
            target: attackerCard.identityInfo,
            healed: stolenLife,
            remainingHealth: attackerCard.actualHealth,
          },
        ],
        energy: attackerCard.actualEnergy,
      });
    }

    report.statusChanges.push(...this.dispatchBleedStacksApplied(attackerCard));
  }

  /**
   * Tells the attacker how many bleed stacks it has laid so far, for the
   * skills waiting on a running total.
   */
  private dispatchBleedStacksApplied(attackerCard: FightingCard): Step[] {
    if (attackerCard.isDead()) return [];

    const reactions = attackerCard.launchSkills(
      `${BLEED_STACKS_APPLIED}:${attackerCard.bleedStacksApplied}`,
      this.getFightingContext(attackerCard),
    );

    return [
      ...skillResultsToSteps(attackerCard, reactions),
      ...this.reactionDeathSteps(attackerCard, reactions),
    ];
  }

  /**
   * Fires the reactive events of a landed hit on the damaged card team:
   * `damage-taken-<id>` on every hit, then `ally-health-<id>` for the
   * threshold-based reactions. Both reach the damaged card itself, so a card
   * reacts to its own wounds by monitoring its own id.
   */
  private dispatchDamageReactions(
    damagedCard: FightingCard,
    attackerCard: FightingCard,
  ): Step[] {
    const damagedCardPlayer = this.player1.ownCard(damagedCard)
      ? this.player1
      : this.player2;
    const context: FightingContext = {
      sourcePlayer: damagedCardPlayer,
      opponentPlayer:
        damagedCardPlayer === this.player1 ? this.player2 : this.player1,
      lastAttacker: attackerCard,
    };

    return damagedCardPlayer.playableCards.flatMap((caster) => {
      const reactions = [
        ...caster.launchSkills(`damage-taken-${damagedCard.id}`, context),
        ...caster.launchSkills(`ally-health-${damagedCard.id}`, context),
      ];
      return [
        ...skillResultsToSteps(caster, reactions, this.endEventProcessor),
        ...this.reactionDeathSteps(caster, reactions),
      ];
    });
  }

  /**
   * A reactive attack can kill too: its victims run the death cascade.
   * `skillResultsToSteps()` already reported their `dead` status.
   */
  private reactionDeathSteps(
    caster: FightingCard,
    reactions: SkillResults[],
  ): Step[] {
    return defendersKilled(reactions).flatMap((card) => {
      this.notifyDeath(card, caster);
      return this.deathSkillHandler.drainSteps();
    });
  }

  private getFightingContext(card: FightingCard): FightingContext {
    const isPlayer1CardOwner = this.player1.ownCard(card);
    return {
      sourcePlayer: isPlayer1CardOwner ? this.player1 : this.player2,
      opponentPlayer: isPlayer1CardOwner ? this.player2 : this.player1,
    };
  }

  /** What the card does after a SURVIVE skill kept it alive. */
  private survivedReactions(card: FightingCard): Step[] {
    const reactions = card.launchSkills(
      'survived',
      this.getFightingContext(card),
    );

    return [
      ...skillResultsToSteps(card, reactions),
      ...this.reactionDeathSteps(card, reactions),
    ];
  }

  /** The executions of an attack, each followed by the reactions it caused. */
  private executionReport(
    attacker: FightingCard,
    name: string,
    executions: ExecutionResult[],
  ): Step[] {
    return executions.flatMap((execution) => [
      ...executionSteps(attacker, name, [execution]),
      ...(execution.survived ? this.survivedReactions(execution.card) : []),
    ]);
  }

  private notifyDeath(card: FightingCard, killerCard?: FightingCard): void {
    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(card, killerCard),
    );
  }

  private buildDebuffReport(
    source: FightingCard,
    name: string,
    debuffs: DebuffResult[],
  ): DebuffReport {
    return {
      kind: StepKind.Debuff,
      name,
      source: source.identityInfo,
      alterations: debuffs.map((debuffResult) => ({
        target: debuffResult.target,
        kind: debuffResult.alteration.type,
        value: debuffResult.alteration.value,
        remainingTurns: debuffResult.alteration.duration,
      })),
      energy: 0,
    };
  }

  private buildShieldAppliedReport(
    source: FightingCard,
    name: string,
    shieldResults: ShieldResult[],
  ): ShieldAppliedReport {
    return {
      kind: StepKind.ShieldApplied,
      name,
      source: source.identityInfo,
      targets: shieldResults.map((r) => ({
        target: r.target,
        points: r.shield.points,
      })),
    };
  }
}
