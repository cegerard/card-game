import { SELF_DEATH_PREFIX } from '../trigger/self-death';
import { ENEMY_BLEED_DEATH } from '../trigger/enemy-bleed-death';
import { StateEffectType } from '../cards/@types/state/state-effect-type';
import { FightingCard } from '../cards/fighting-card';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step } from './@types/step';
import { SkillKind, SkillResults } from '../cards/skills/skill';
import { AttackResult } from '../cards/@types/action-result/attack-result';
import { EndEventProcessor } from './end-event-processor';
import { FightingContext } from '../cards/@types/fighting-context';
import { skillResultsToSteps } from './skill-results-to-steps';
import { Player } from '../player';

/**
 * Handles the cascade of effects that must fire immediately after a card dies.
 *
 * Ordering inside `notifyDeath` (must be preserved):
 * 1. **Lifecycle end-events** – the dead card's skills may have emitted end-events
 *    (e.g. an activation-limited buff skill that expires on death). These are
 *    processed first so that any event-bound buffs/effects they cancel are already
 *    gone before surviving cards react.
 * 2. **Self-death triggers** – the dead card's own skills listening for
 *    `self-death:<deadCard.id>` fire next, so what it leaves behind lands before
 *    anyone answers its death. It is the only phase running on the fallen card.
 *    A card those skills kill goes through its own cascade right away, through
 *    `notifyKill` so every death subscriber hears of it.
 * 3. **Ally-death triggers** – skills on the dead card's own team that listen for
 *    `ally-death:<deadCard.id>` are fired next.
 * 4. **Enemy-death triggers** – skills on the opposing team that listen for
 *    `enemy-death:<deadCard.id>` are fired next.
 * 5. **Enemy-bleed-death triggers** – when the card bled out, skills on the
 *    opposing team that listen for `enemy-bleed-death` are fired last.
 *
 * A card is processed once: a second notification of the same death is ignored.
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
  private readonly notifiedDeaths = new Set<FightingCard>();
  private readonly notifyKill: CardDeathSubscriber['notifyDeath'];

  /**
   * @param notifyKill - Announces a card killed during the cascade (by a
   *   self-death skill) to every death subscriber. Defaults to this handler
   *   alone; the fight wires its whole event broker.
   */
  constructor(
    player1: Player,
    player2: Player,
    endEventProcessor?: EndEventProcessor,
    notifyKill?: CardDeathSubscriber['notifyDeath'],
  ) {
    this.player1 = player1;
    this.player2 = player2;
    this.endEventProcessor = endEventProcessor;
    this.notifyKill =
      notifyKill ?? ((card, killer) => this.notifyDeath(card, killer));
  }

  /**
   * Reacts to a card death by running the three-phase cascade described on the
   * class. Steps produced by each phase are appended to the internal buffer in
   * order; retrieve them with `drainSteps()`.
   *
   * @param deadCard - The card that just died.
   * @param killerCard - The card responsible for the kill (forwarded to triggered
   *   skills so they can, for example, target the killer via a `DynamicTrigger`).
   * @param cause - The status whose tick killed the card, absent for a kill by
   *   an attack.
   */
  notifyDeath(
    deadCard: FightingCard,
    killerCard?: FightingCard,
    cause?: StateEffectType,
  ): void {
    // A card killed inside a cascade can be reported again by the attack that
    // started it; its death runs once.
    if (this.notifiedDeaths.has(deadCard)) return;
    this.notifiedDeaths.add(deadCard);

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

    // The fallen card speaks first: what it leaves behind must land before the
    // survivors react to its death, so an ally's answer builds on the legacy
    // rather than racing it.
    const lastWords = this.fireSkillsOnCards(
      [deadCard],
      `${SELF_DEATH_PREFIX}:${deadCard.id}`,
      ownerPlayer,
      opponentPlayer,
      killerCard,
    );
    killedBy(lastWords).forEach((killed) => this.notifyKill(killed, deadCard));

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

    if (cause === 'bleed') {
      this.fireSkillsOnCards(
        opponentPlayer.playableCards,
        ENEMY_BLEED_DEATH,
        opponentPlayer,
        ownerPlayer,
        killerCard,
      );
    }
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
  ): SkillResults[] {
    return cards.flatMap((card) => {
      const context: FightingContext = {
        sourcePlayer,
        opponentPlayer,
        killerCard,
      };

      const skillResults = card.launchSkills(triggerId, context);
      this.convertSkillResultsToSteps(card, skillResults);
      return skillResults;
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

function killedBy(skillResults: SkillResults[]): FightingCard[] {
  return skillResults
    .filter((r) => r.skillKind === SkillKind.Attack)
    .flatMap((r) => r.results as AttackResult[])
    .map((r) => r.defender)
    .filter((card) => card.isDead());
}
