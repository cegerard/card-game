import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step, StepKind } from './@types/step';
import {
  BuffResult,
  BuffResults,
} from '../cards/@types/action-result/buff-results';
import {
  DebuffResult,
  DebuffResults,
} from '../cards/@types/action-result/debuff-results';
import { SkillKind, SkillResults } from '../cards/skills/skill';
import { EndEventProcessor } from './end-event-processor';
import { TargetingOverrideReport } from './@types/targeting-override-report';
import { FightingContext } from '../cards/@types/fighting-context';

export class DeathSkillHandler implements CardDeathSubscriber {
  private steps: Step[] = [];
  private player1: Player;
  private player2: Player;
  private endEventProcessor?: EndEventProcessor;

  constructor(
    player1: Player,
    player2: Player,
    endEventProcessor?: EndEventProcessor,
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.endEventProcessor = endEventProcessor;
  }

  notifyDeath(
    _player: Player,
    deadCard: FightingCard,
    killerCard?: FightingCard,
  ): void {
    const ownerPlayer = this.player1.ownCard(deadCard)
      ? this.player1
      : this.player2;
    const opponentPlayer =
      ownerPlayer === this.player1 ? this.player2 : this.player1;

    if (this.endEventProcessor) {
      const endEvents = deadCard.lifecycleEndEvents();
      endEvents.forEach((eventName) => {
        this.steps.push(
          ...this.endEventProcessor.processEndEvent(
            eventName,
            deadCard.identityInfo,
          ),
        );
      });
    }

    const allyTriggerId = `ally-death:${deadCard.id}`;
    this.fireSkillsOnCards(
      ownerPlayer.playableCards,
      allyTriggerId,
      ownerPlayer,
      opponentPlayer,
      killerCard,
    );

    const enemyTriggerId = `enemy-death:${deadCard.id}`;
    this.fireSkillsOnCards(
      opponentPlayer.playableCards,
      enemyTriggerId,
      opponentPlayer,
      ownerPlayer,
      killerCard,
    );
  }

  drainSteps(): Step[] {
    const drained = this.steps;
    this.steps = [];
    return drained;
  }

  private fireSkillsOnCards(
    cards: FightingCard[],
    triggerId: string,
    sourcePlayer: Player,
    opponentPlayer: Player,
    killerCard?: FightingCard,
  ): void {
    cards.forEach((card) => {
      const context: FightingContext = {
        sourcePlayer,
        opponentPlayer,
        killerCard,
      };

      const skillResults = card.launchSkills(triggerId, context);
      this.convertSkillResultsToSteps(card, skillResults);
    });
  }

  private convertSkillResultsToSteps(
    card: FightingCard,
    skillResults: SkillResults[],
  ): void {
    for (const skillResult of skillResults) {
      if (skillResult.skillKind === SkillKind.Healing) {
        this.steps.push({
          kind: StepKind.Healing,
          source: card.identityInfo,
          heal: skillResult.results.map((heal) => ({
            target: heal.target,
            healed: heal.healAmount,
            remainingHealth: heal.remainingHealth,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
      }

      if (skillResult.skillKind === SkillKind.Buff) {
        const buffResults = skillResult.results as BuffResults;
        if (buffResults.length > 0) {
          this.steps.push({
            kind: StepKind.Buff,
            source: card.identityInfo,
            buffs: buffResults.map((result: BuffResult) => ({
              target: result.target,
              kind: result.buff.type,
              value: result.buff.value,
              remainingTurns: result.buff.duration,
            })),
            energy: card.actualEnergy,
            powerId: skillResult.powerId,
          });
        }

        if (skillResult.endEvent && this.endEventProcessor) {
          this.steps.push(
            ...this.endEventProcessor.processEndEvent(
              skillResult.endEvent,
              card.identityInfo,
              skillResult.powerId,
            ),
          );
        }
      }

      if (skillResult.skillKind === SkillKind.Debuff) {
        const debuffResults = skillResult.results as DebuffResults;
        this.steps.push({
          kind: StepKind.Debuff,
          source: card.identityInfo,
          debuffs: debuffResults.map((result: DebuffResult) => ({
            target: result.target,
            kind: result.debuff.type,
            value: result.debuff.value,
            remainingTurns: result.debuff.duration,
          })),
          energy: card.actualEnergy,
          powerId: skillResult.powerId,
        });
      }

      if (skillResult.skillKind === SkillKind.TargetingOverride) {
        const reports =
          skillResult.results as unknown as TargetingOverrideReport[];
        reports.forEach((report) => this.steps.push(report));
      }
    }
  }
}
