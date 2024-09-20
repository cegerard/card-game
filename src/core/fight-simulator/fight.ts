import { FightResult } from './@types/fight-result';
import { AttackStage } from '../card-attack/attack_stage';
import { Player } from '../player';
import { CardSelector } from './card-selectors/card-selector';
import { CardDeathSubscriber } from './card-death-subscriber';

export class Fight {
  private player1: Player;
  private player2: Player;
  private stepCounter = 0;
  private loopCounter = 0;

  private attackManager: AttackStage;
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
    this.attackManager = new AttackStage(player1, player2, this.eventBroker);
    this.cardSelector = cardSelector;
  }

  public start(): FightResult {
    const steps = {};

    while (this.bothPlayersCanFight() && this.thereIsTimeLeft()) {
      const nextIterationSteps = this.nextIteration();

      nextIterationSteps.forEach((step) => {
        steps[++this.stepCounter] = step;
      });

      this.loopCounter++;
    }

    this.computeWinner(steps);

    return steps;
  }

  private bothPlayersCanFight(): boolean {
    return this.player1.status() > 0 && this.player2.status() > 0;
  }

  private thereIsTimeLeft(): boolean {
    return this.loopCounter < 100;
  }

  private nextIteration() {
    return this.attackManager.computeNextAttack(this.cardSelector.nextCards());
  }

  private computeWinner(steps: {}): void {
    let winner: string | null = null;

    if (this.player1.status() > this.player2.status()) {
      winner = this.player1.name;
    } else if (this.player2.status() > this.player1.status()) {
      winner = this.player2.name;
    }

    steps[++this.stepCounter] = { kind: 'fight_end', winner };
  }
}
