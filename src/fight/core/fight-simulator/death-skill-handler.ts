import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step } from './@types/step';
import { SkillResults } from '../cards/skills/skill';
import { EndEventProcessor } from './end-event-processor';
import { FightingContext } from '../cards/@types/fighting-context';
import { skillResultsToSteps } from './skill-results-to-steps';

/**
 * Handles the cascade of effects that must fire immediately after a card dies.
 *
 * Ordering inside `notifyDeath` (must be preserved):
 * 1. **Lifecycle end-events** – the dead card's skills may have emitted end-events
 *    (e.g. an activation-limited buff skill that expires on death). These are
 *    processed first so that any event-bound buffs/effects they cancel are already
 *    gone before surviving cards react.
 * 2. **Ally-death triggers** – skills on the dead card's own team that listen for
 *    `ally-death:<deadCard.id>` are fired next.
 * 3. **Enemy-death triggers** – skills on the opposing team that listen for
 *    `enemy-death:<deadCard.id>` are fired last.
 *
 * All resulting steps are accumulated internally. Callers must call `drainSteps()`
 * immediately after each `notifyDeath` invocation to collect them, because the
 * buffer is cleared on every drain.
 */
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

  /**
   * Reacts to a card death by running the three-phase cascade described on the
   * class. Steps produced by each phase are appended to the internal buffer in
   * order; retrieve them with `drainSteps()`.
   *
   * @param _player - Unused; the owning player is resolved from `deadCard` directly.
   * @param deadCard - The card that just died.
   * @param killerCard - The card responsible for the kill (forwarded to triggered
   *   skills so they can, for example, target the killer via a `DynamicTrigger`).
   */
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

  /**
   * Returns all steps accumulated since the last drain and resets the buffer.
   * Must be called after every `notifyDeath` invocation; subsequent deaths
   * start accumulating into a fresh buffer.
   */
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
