import {
  BuffResult,
  BuffResults,
} from '../cards/@types/action-result/buff-results';
import { FightingContext } from '../cards/@types/fighting-context';
import { FightingCard } from '../cards/fighting-card';
import { SkillKind } from '../cards/skills/skill';
import { Player } from '../player';
import { Step, StepKind } from './@types/step';
import { CardDeathSubscriber } from './card-death-subscriber';

export class TurnManager {
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

  public endTurn(cards: FightingCard[]): Step[] {
    const steps: Step[] = [];

    cards.forEach((card) => {
      card.decreaseBuffDuration();
      this.processCardSkill(card, steps);
      this.processCardEffectStates(card, steps);
    });

    return steps;
  }

  private processCardSkill(card: FightingCard, steps: Step[]) {
    const appliedSkill = card.launchSkill(
      'turn-end',
      this.getFightingContext(card),
    );

    if (appliedSkill?.skillKind === SkillKind.Healing) {
      steps.push({
        kind: StepKind.Healing,
        source: card.identityInfo,
        heal: appliedSkill.results.map((heal) => ({
          target: heal.target,
          healed: heal.healAmount,
          remainingHealth: heal.remainingHealth,
        })),
        energy: card.actualEnergy,
      });
    }

    if (appliedSkill?.skillKind === SkillKind.Buff) {
      const buffResults = appliedSkill.results as BuffResults;
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
      });
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
