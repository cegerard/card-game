import {
  BuffResult,
  BuffResults,
} from '../cards/@types/action-result/buff-results';
import {
  DebuffResult,
  DebuffResults,
} from '../cards/@types/action-result/debuff-results';
import { FightingContext } from '../cards/@types/fighting-context';
import { FightingCard } from '../cards/fighting-card';
import { SkillKind } from '../cards/skills/skill';
import { Player } from '../player';
import { Step, StepKind } from './@types/step';
import { TargetingOverrideReport } from './@types/targeting-override-report';
import { CardDeathSubscriber } from './card-death-subscriber';
import { DeathSkillHandler } from './death-skill-handler';
import { EndEventProcessor } from './end-event-processor';

export class TurnManager {
  private player1: Player;
  private player2: Player;
  private eventBroker: {
    onCardDeath: CardDeathSubscriber[];
  };
  private deathSkillHandler: DeathSkillHandler;
  private endEventProcessor: EndEventProcessor;

  public constructor(
    player1: Player,
    player2: Player,
    eventBroker: {
      onCardDeath: CardDeathSubscriber[];
    },
    deathSkillHandler: DeathSkillHandler,
    endEventProcessor: EndEventProcessor,
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.eventBroker = eventBroker;
    this.deathSkillHandler = deathSkillHandler;
    this.endEventProcessor = endEventProcessor;
  }

  public endTurn(cards: FightingCard[]): Step[] {
    const steps: Step[] = [];

    cards.forEach((card) => {
      card.decreaseBuffAndDebuffDuration();
      this.processCardSkill(card, steps);
      this.processCardEffectStates(card, steps);
    });

    steps.push(...this.deathSkillHandler.drainSteps());

    return steps;
  }

  private processCardSkill(card: FightingCard, steps: Step[]) {
    const appliedSkills = card.launchSkills(
      'turn-end',
      this.getFightingContext(card),
    );

    for (const appliedSkill of appliedSkills) {
      if (appliedSkill.skillKind === SkillKind.Healing) {
        steps.push({
          kind: StepKind.Healing,
          source: card.identityInfo,
          heal: appliedSkill.results.map((heal) => ({
            target: heal.target,
            healed: heal.healAmount,
            remainingHealth: heal.remainingHealth,
          })),
          energy: card.actualEnergy,
          powerId: appliedSkill.powerId,
        });
      }

      if (appliedSkill.skillKind === SkillKind.Buff) {
        const buffResults = appliedSkill.results as BuffResults;
        if (buffResults.length > 0) {
          steps.push({
            kind: StepKind.Buff,
            source: card.identityInfo,
            buffs: buffResults.map((result: BuffResult) => ({
              target: result.target,
              kind: result.buff.type,
              value: result.buff.value,
              remainingTurns: result.buff.duration,
            })),
            energy: card.actualEnergy,
            powerId: appliedSkill.powerId,
          });
        }

        if (appliedSkill.endEvent) {
          steps.push(
            ...this.endEventProcessor.processEndEvent(
              appliedSkill.endEvent,
              card.identityInfo,
              appliedSkill.powerId,
            ),
          );
        }
      }

      if (appliedSkill.skillKind === SkillKind.Debuff) {
        const debuffResults = appliedSkill.results as DebuffResults;
        steps.push({
          kind: StepKind.Debuff,
          source: card.identityInfo,
          debuffs: debuffResults.map((result: DebuffResult) => ({
            target: result.target,
            kind: result.debuff.type,
            value: result.debuff.value,
            remainingTurns: result.debuff.duration,
          })),
          energy: card.actualEnergy,
          powerId: appliedSkill.powerId,
        });
      }

      if (appliedSkill.skillKind === SkillKind.TargetingOverride) {
        const reports =
          appliedSkill.results as unknown as TargetingOverrideReport[];
        reports.forEach((report) => steps.push(report));
      }
    }
  }

  private processCardEffectStates(card: FightingCard, steps: Step[]) {
    const stateEffects = card.applyStateEffects();
    stateEffects.forEach((result) => {
      steps.push({
        kind: StepKind.StateEffect,
        card: card.identityInfo,
        type: result.type,
        damage: result.damage,
        remainingTurns: result.remainingTurns,
        remainingHealth: result.remainingHealth,
      });
    });

    if (stateEffects.length > 0 && card.isDead()) {
      this.notifyDeath(card);
      steps.push({
        kind: StepKind.StatusChange,
        card: card.identityInfo,
        status: 'dead',
      });
    }
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
