import { FightResult } from './@types/fight-result';
import { AttackStage } from '../card-attack/attack_stage';
import { Player } from '../player';
import { FightingCard } from '../cards/fighting-card';

export class Fight {
  private player1: Player;
  private player2: Player;
  private stepCounter = 0;
  private loopCounter = 0;
  private lastSelectedPlayer: Player | null = null;

  private attackManager: AttackStage;

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;

    this.attackManager = new AttackStage(player1, player2);
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
    return this.attackManager.computeNextAttack(this.nextCardToAttack());
  }

  private nextCardToAttack(): FightingCard[] {
    if (this.lastSelectedPlayer == this.player1) {
      const player2NextCard = this.player2.nextCardToPlay();
      return [this.selectPlayerCard(this.player2, player2NextCard)];
    }

    if (this.lastSelectedPlayer == this.player2) {
      const player1NextCard = this.player1.nextCardToPlay();
      return [this.selectPlayerCard(this.player1, player1NextCard)];
    }

    const player1NextCard = this.player1.nextCardToPlay();
    const player2NextCard = this.player2.nextCardToPlay();

    if (player1NextCard.fasterThan(player2NextCard)) {
      return [this.selectPlayerCard(this.player1, player1NextCard)];
    }

    if (player2NextCard.fasterThan(player1NextCard)) {
      return [this.selectPlayerCard(this.player2, player2NextCard)];
    }

    this.player1.updateAlreadyPlayedCard(player1NextCard);
    this.player2.updateAlreadyPlayedCard(player2NextCard);
    return [player1NextCard, player2NextCard];
  }

  private selectPlayerCard(
    player: Player,
    nextCard: FightingCard,
  ): FightingCard {
    this.lastSelectedPlayer = player;
    player.updateAlreadyPlayedCard(nextCard);

    return nextCard;
  }

  private computeWinner(steps: {}): void {
    let winner: Player | null = null;

    if (this.player1.status() > this.player2.status()) {
      winner = this.player1;
    } else if (this.player2.status() > this.player1.status()) {
      winner = this.player2;
    }

    steps[++this.stepCounter] = { kind: 'fight_end', winner };
  }
}
