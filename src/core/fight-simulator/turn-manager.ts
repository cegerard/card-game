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
      const results = card.launchSkill(
        'turn-end',
        this.getFightingContext(card),
      );

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
    });

    return steps;
  }

  private getFightingContext(card: FightingCard): FightingContext {
    const isPlayer1CardOwner = this.player1.ownCard(card);
    return {
      sourcePlayer: isPlayer1CardOwner ? this.player1 : this.player2,
      opponentPlayer: isPlayer1CardOwner ? this.player2 : this.player1,
    };
  }
}
