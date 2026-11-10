import { fightingContextOf } from './fighting-context-of';
import { FightingCard } from '../cards/fighting-card';
import { StateEffectType } from '../cards/@types/state/state-effect-type';
import { Player } from '../player';
import { Step, StepKind } from './@types/step';
import { CardDeathSubscriber } from './card-death-subscriber';
import { DeathSkillHandler } from './death-skill-handler';
import { EndEventProcessor } from './end-event-processor';
import { reactiveKillSteps } from './reactive-kill-steps';
import { skillResultsToSteps } from './skill-results-to-steps';
import { fightSurvivedReactor, SurvivedReactor } from './survived-reactions';
import { triggerReactiveSkills } from './reactive-skill-checker';
import { concealmentEndedReport } from './concealment-steps';
import { stanceEndedReport } from './stance-steps';
import { effectResultsToSteps } from './effect-results-to-steps';

export class TurnManager {
  private player1: Player;
  private player2: Player;
  private eventBroker: {
    onCardDeath: CardDeathSubscriber[];
  };
  private deathSkillHandler: DeathSkillHandler;
  private endEventProcessor: EndEventProcessor;
  private readonly survivedReactor: SurvivedReactor;

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
    this.survivedReactor = fightSurvivedReactor(
      (card) => fightingContextOf(card, this.player1, this.player2),
      eventBroker,
      deathSkillHandler,
      endEventProcessor,
    );
  }

  public endTurn(cards: FightingCard[]): Step[] {
    const steps: Step[] = [];

    cards.forEach((card) => {
      if (card.isDead()) return;
      const { expiredBuffs, expiredDebuffs } =
        card.decreaseBuffAndDebuffDuration();
      if (expiredBuffs.length > 0) {
        steps.push({
          kind: StepKind.BuffExpired,
          card: card.identityInfo,
          expired: expiredBuffs.map((b) => ({ kind: b.type, value: b.value })),
        });
      }
      if (expiredDebuffs.length > 0) {
        steps.push({
          kind: StepKind.DebuffExpired,
          card: card.identityInfo,
          expired: expiredDebuffs.map((d) => ({
            kind: d.type,
            value: d.value,
          })),
        });
      }
      card.decreaseLifestealDuration();
      card.decreaseStatusImmunityDuration();
      const endedTransformation = card.decreaseTransformationDuration();
      if (endedTransformation) {
        steps.push({
          kind: StepKind.TransformationEnded,
          name: endedTransformation.name,
          card: card.identityInfo,
          healthCost: endedTransformation.healthCost,
          remainingHealth: card.actualHealth,
        });
      }
      const freedAlly = card.decreaseProtectionDuration();
      if (freedAlly) {
        steps.push({
          kind: StepKind.ProtectionEnded,
          card: card.identityInfo,
          protectedCard: freedAlly.identityInfo,
        });
      }
      const expiredShield = card.decreaseShieldDuration();
      if (expiredShield) {
        steps.push({ kind: StepKind.ShieldExpired, card: card.identityInfo });
      }
      card.decreaseStanceDurations().forEach((name) => {
        steps.push(stanceEndedReport(card, name));
      });
      steps.push(
        ...effectResultsToSteps(card, card.decreaseWeakPointDurations()),
      );
      card.decreaseBattlefieldDurations().forEach((name) =>
        steps.push({
          kind: StepKind.BattlefieldEnded,
          name,
          card: card.identityInfo,
        }),
      );
      const expiredConcealment = card.decreaseConcealmentDuration();
      if (expiredConcealment) {
        steps.push(concealmentEndedReport(card, expiredConcealment, 'expired'));
      }
      this.processCardSkill(card, steps);
      // Regeneration runs before the status ticks: the card mends itself, then
      // the poison bites into what is left.
      this.processCardRegeneration(card, steps);
      this.processBattlefields(card, steps);
      this.processCardEffectStates(card, steps);
    });

    this.countTurnOfTheDead(cards);
    steps.push(...this.deathSkillHandler.drainSteps());

    return steps;
  }

  private processCardSkill(card: FightingCard, steps: Step[]) {
    const appliedSkills = card.launchSkills(
      'turn-end',
      fightingContextOf(card, this.player1, this.player2),
    );
    steps.push(
      ...skillResultsToSteps(
        card,
        appliedSkills,
        this.endEventProcessor,
        this.survivedReactor,
      ),
    );
    steps.push(
      ...reactiveKillSteps(
        appliedSkills,
        card,
        this.eventBroker,
        this.deathSkillHandler,
      ),
    );
  }

  private processCardRegeneration(card: FightingCard, steps: Step[]) {
    const healed = card.regenerate();
    if (healed <= 0) return;

    steps.push({
      kind: StepKind.Regenerated,
      card: card.identityInfo,
      healed,
      remainingHealth: card.actualHealth,
    });
  }

  /** The heals and hazards of the battlefields the card stands in. */
  private processBattlefields(card: FightingCard, steps: Step[]) {
    const ticks = card.tickBattlefields();
    ticks.forEach((tick) => {
      if (tick.healed !== undefined) {
        steps.push({
          kind: StepKind.Healing,
          name: tick.name,
          source: tick.source.identityInfo,
          heal: [
            {
              target: card.identityInfo,
              healed: tick.healed,
              remainingHealth: card.actualHealth,
            },
          ],
          energy: tick.source.actualEnergy,
        });
        return;
      }
      steps.push({
        kind: StepKind.Attack,
        name: tick.name,
        attacker: tick.source.identityInfo,
        damages: [
          {
            defender: card.identityInfo,
            damage: tick.damage,
            isCritical: false,
            dodge: false,
            remainingHealth: card.actualHealth,
            kind: [tick.damageType],
          },
        ],
        energy: tick.source.actualEnergy,
      });
    });
    if (ticks.length === 0 || !card.isDead()) return;

    // A fallen caster still owns the hazard it left, but kills nobody.
    const killer = ticks
      .filter((tick) => tick.damage !== undefined)
      .map((tick) => tick.source)
      .find((source) => !source.isDead());
    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(card, killer),
    );
    steps.push({
      kind: StepKind.StatusChange,
      card: card.identityInfo,
      status: 'dead',
    });
  }

  /** Every side that played counts one more turn for its dead cards. */
  private countTurnOfTheDead(cards: FightingCard[]) {
    [this.player1, this.player2]
      .filter((player) => cards.some((card) => player.ownCard(card)))
      .forEach((player) =>
        player.allCards.forEach((card) => card.countTurnDead()),
      );
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
        ...(result.remainingStacks !== undefined && {
          remainingStacks: result.remainingStacks,
        }),
      });
    });

    if (stateEffects.length > 0 && card.isDead()) {
      // A tick combining several statuses is credited to the bleed as soon as
      // it bit, so a bleed finishing off a poisoned card still counts.
      const bled = stateEffects.some((result) => result.type === 'bleed');
      this.notifyDeath(card, bled ? 'bleed' : stateEffects[0].type);
      steps.push({
        kind: StepKind.StatusChange,
        card: card.identityInfo,
        status: 'dead',
      });
    } else if (stateEffects.length > 0) {
      const reactiveResults = triggerReactiveSkills(
        card,
        fightingContextOf(card, this.player1, this.player2),
      );
      steps.push(...skillResultsToSteps(card, reactiveResults));
    }
  }

  private notifyDeath(card: FightingCard, cause?: StateEffectType): void {
    this.eventBroker.onCardDeath.forEach((subscriber) =>
      subscriber.notifyDeath(card, undefined, cause),
    );
  }
}
