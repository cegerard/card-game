import { FightingCard } from 'src/core/cards/fighting-card';
import { Player } from 'src/core/player';
import { CardSelector } from './card-selector';

export class PlayerByPlayerCardSelector implements CardSelector {
  private player1: Player;
  private player2: Player;
  private lastSelectedPlayer: Player | null = null;

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;
  }

  public nextCards(): FightingCard[] {
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
}
