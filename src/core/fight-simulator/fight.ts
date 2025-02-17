import { FightResult } from './@types/fight-result';
import { ActionStage } from '../card-action/action_stage';
import { Player } from '../player';
import { CardSelector } from './card-selectors/card-selector';
import { CardDeathSubscriber } from './card-death-subscriber';
import { Step, StepKind } from './@types/step';
import { TurnManager } from './turn-manager';

export class Fight {
  private player1: Player;
  private player2: Player;
  private stepCounter = 0;
  private loopCounter = 0;

  private actionManager: ActionStage;
  private turnManager: TurnManager;
  private cardSelector: CardSelector;
  private eventBroker: {
    onCardDeath: CardDeathSubscriber[];
  };

  constructor(player1: Player, player2: Player, cardSelector: CardSelector) {
    this.eventBroker = {
      onCardDeath: [cardSelector],
    };

    this.player1 = player1;
    this.player2 = player2;
    this.actionManager = new ActionStage(player1, player2, this.eventBroker);
    this.turnManager = new TurnManager(player1, player2);
    this.cardSelector = cardSelector;
  }

  public start(): FightResult {
    const fightResult: FightResult = {};

    while (this.bothPlayersCanFight() && this.thereIsTimeLeft()) {
      const nextIterationSteps = this.nextIteration();

      nextIterationSteps.forEach((step) => {
        fightResult[++this.stepCounter] = step;
      });

      this.loopCounter++;
    }

    this.computeWinner(fightResult);

    return fightResult;
  }

  private bothPlayersCanFight(): boolean {
    return this.player1.status() > 0 && this.player2.status() > 0;
  }

  private thereIsTimeLeft(): boolean {
    return this.loopCounter < 100;
  }

  private nextIteration(): Step[] {
    const cards = this.cardSelector.nextCards();
    const actionSteps = this.actionManager.computeNextAction(cards);
    const endTurnSteps = this.turnManager.endTurn(cards);

    return [...actionSteps, ...endTurnSteps];
  }

  private computeWinner(steps: Record<number, object>): void {
    let winner: string | null = null;

    if (this.player1.status() > this.player2.status()) {
      winner = this.player1.name;
    } else if (this.player2.status() > this.player1.status()) {
      winner = this.player2.name;
    }

    steps[++this.stepCounter] = { kind: StepKind.FightEnd, winner };
  }
}
