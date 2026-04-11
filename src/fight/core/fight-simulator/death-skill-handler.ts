import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step } from './@types/step';
import { SkillResults } from '../cards/skills/skill';
import { EndEventProcessor } from './end-event-processor';
import { FightingContext } from '../cards/@types/fighting-context';
import { skillResultsToSteps } from './skill-results-to-steps';

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
    this.steps.push(
      ...skillResultsToSteps(card, skillResults, this.endEventProcessor),
    );
  }
}
