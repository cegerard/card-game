import { fightingContextOf } from './fighting-context-of';
import { SELF_DEATH_PREFIX } from '../trigger/self-death';
import { ENEMY_BLEED_DEATH } from '../trigger/enemy-bleed-death';
import { ENEMY_KILLED } from '../trigger/enemy-killed';
import { POISONED_ENEMY_DEATH } from '../trigger/poisoned-enemy-death';
import { StateEffectType } from '../cards/@types/state/state-effect-type';
import { FightingCard } from '../cards/fighting-card';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step } from './@types/step';
import { SkillResults } from '../cards/skills/skill';
import { defendersKilled } from './defenders-killed';
import { EndEventProcessor } from './end-event-processor';
import { FightingContext } from '../cards/@types/fighting-context';
import { skillResultsToSteps } from './skill-results-to-steps';
import { Player } from '../player';
import { SurvivedReactor, survivedReactions } from './survived-reactions';
import { ANY_ALLY_DEATH } from '../trigger/any-ally-death';
import { legacySteps } from './battlefield-steps';

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
 *    A card a reactive attack kills in any phase goes through its own cascade
 *    right away, through `notifyKill` so every death subscriber hears of it,
 *    credited to the card that fired the attack.
 * 3. **Battlefield legacy** – a battlefield the card laid and still running
 *    lasts longer and empowers its living allies, once.
 * 4. **Ally-death triggers** – skills on the dead card's own team that listen for
 *    `ally-death:<deadCard.id>`, then `any-ally-death`, are fired next.
 * 5. **Enemy-death triggers** – skills on the opposing team that listen for
 *    `enemy-death:<deadCard.id>` are fired next.
 * 6. **Enemy-bleed-death triggers** – when the card bled out, skills on the
 *    opposing team that listen for `enemy-bleed-death` are fired next.
 * 7. **Poisoned-enemy-death triggers** – when the card carried a stacked
 *    poison, the living enemy that laid it hears of the death, whoever killed.
 * 8. **Enemy-killed triggers** – when an enemy dealt the fatal blow and is
 *    still alive, its own skills listening for `enemy-killed` fire last, with
 *    the health ratio the victim had just before the blow. A card the reward
 *    kills goes through its own cascade right away, like a self-death kill.
 *
 * A death is processed once: a second notification of it is ignored, while a
 * revived card that falls again dies anew.
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
  /** Each card notified, with the revivals it had when it died. */
  private readonly notifiedDeaths = new Map<FightingCard, number>();
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
    if (this.notifiedDeaths.get(deadCard) === deadCard.revivals) return;
    this.notifiedDeaths.set(deadCard, deadCard.revivals);

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
    this.fireSkillsOnCards(
      [deadCard],
      `${SELF_DEATH_PREFIX}:${deadCard.id}`,
      ownerPlayer,
      opponentPlayer,
      killerCard,
      true,
    );

    this.leaveLegacy(deadCard);

    const allyTriggerId = `ally-death:${deadCard.id}`;
    this.fireSkillsOnCards(
      ownerPlayer.playableCards,
      allyTriggerId,
      ownerPlayer,
      opponentPlayer,
      killerCard,
    );
    this.fireSkillsOnCards(
      ownerPlayer.playableCards,
      ANY_ALLY_DEATH,
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

    const poisoner = deadCard.poisoner;
    if (poisoner && !poisoner.isDead() && opponentPlayer.ownCard(poisoner)) {
      this.fireSkillsOnCards(
        [poisoner],
        POISONED_ENEMY_DEATH,
        opponentPlayer,
        ownerPlayer,
        killerCard,
      );
    }

    if (
      killerCard &&
      !killerCard.isDead() &&
      opponentPlayer.ownCard(killerCard)
    ) {
      this.fireSkillsOnCards(
        [killerCard],
        `${ENEMY_KILLED}:${deadCard.healthRatioBeforeLastDamage}`,
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

  /** The battlefields the dead card laid outlive it, as their legacy says. */
  private leaveLegacy(deadCard: FightingCard): void {
    const players = [this.player1, this.player2];
    const deployments = new Set(
      players
        .flatMap((player) => player.allCards)
        .flatMap((card) => card.battlefieldDeployments)
        .filter((deployment) => deployment.source === deadCard),
    );
    deployments.forEach((deployment) => {
      const legacy = deployment.fallOfSource(players);
      if (legacy) this.steps.push(...legacySteps(deadCard, legacy));
    });
  }

  private fireSkillsOnCards(
    cards: FightingCard[],
    triggerId: string,
    sourcePlayer: Player,
    opponentPlayer: Player,
    killerCard?: FightingCard,
    includeDeadCards = false,
  ): void {
    cards.forEach((card) => {
      // A reactive kill earlier in the loop can have felled this card; only the
      // self-death phase speaks for a dead one.
      if (card.isDead() && !includeDeadCards) return;

      const context: FightingContext = {
        sourcePlayer,
        opponentPlayer,
        killerCard,
      };

      const skillResults = card.launchSkills(triggerId, context);
      // Notified after the steps are pushed: a cascade started while the
      // reactions are being converted would drain steps ahead of them.
      const survivedKills: [FightingCard, FightingCard][] = [];
      const reactToSurvival: SurvivedReactor = (survivor) =>
        survivedReactions(
          survivor,
          fightingContextOf(survivor, this.player1, this.player2),
          (reactions) => {
            defendersKilled(reactions).forEach((killed) =>
              survivedKills.push([killed, survivor]),
            );
            return [];
          },
          this.endEventProcessor,
          reactToSurvival,
        );
      this.convertSkillResultsToSteps(card, skillResults, reactToSurvival);
      // A reactive attack can kill too: its victims run their own cascade,
      // credited to the card that fired it.
      defendersKilled(skillResults).forEach((killed) =>
        this.notifyKill(killed, card),
      );
      survivedKills.forEach(([killed, killer]) =>
        this.notifyKill(killed, killer),
      );
    });
  }

  private convertSkillResultsToSteps(
    card: FightingCard,
    skillResults: SkillResults[],
    survivedReactor: SurvivedReactor,
  ): void {
    this.steps.push(
      ...skillResultsToSteps(
        card,
        skillResults,
        this.endEventProcessor,
        survivedReactor,
      ),
    );
  }
}
