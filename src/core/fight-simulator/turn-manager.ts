import { FightingContext } from '../cards/@types/fighting-context';
import { FightingCard } from '../cards/fighting-card';
import { Player } from '../player';
import { Step, StepKind } from './@types/step';

export class TurnManager {
  private player1: Player;
  private player2: Player;

  public constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;
  }

  public endTurn(cards: FightingCard[]): Step[] {
    const steps: Step[] = [];

    cards.forEach((card) => {
      this.processCardSkill(card, steps);
      this.processCardEffectStates(card, steps);
    });

    return steps;
  }

  private processCardSkill(card: FightingCard, steps: Step[]) {
    const results = card.launchSkill('turn-end', this.getFightingContext(card));

    if (results !== null) {
      steps.push({
        kind: StepKind.Healing,
        source: card.identityInfo,
        heal: results.map((heal) => ({
          target: heal.target,
          healed: heal.healAmount,
          remainingHealth: heal.remainingHealth,
        })),
        energy: card.actualEnergy,
      });
    }
  }

  private processCardEffectStates(card: FightingCard, steps: Step[]) {
    card.applyStateEffects().forEach((result) => {
      steps.push({
        kind: StepKind.StateEffect,
        card: card.identityInfo,
        type: result.type,
        damage: result.damage,
        remainingTurns: result.remainingTurns,
      });
    });
  }

  private getFightingContext(card: FightingCard): FightingContext {
    const isPlayer1CardOwner = this.player1.ownCard(card);
    return {
      sourcePlayer: isPlayer1CardOwner ? this.player1 : this.player2,
      opponentPlayer: isPlayer1CardOwner ? this.player2 : this.player1,
    };
  }
}
