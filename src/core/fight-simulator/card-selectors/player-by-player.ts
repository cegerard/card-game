import { FightingCard } from 'src/core/cards/fighting-card';
import { Player } from 'src/core/player';
import { CardSelector } from './card-selector';

export class PlayerByPlayerCardSelector implements CardSelector {
  private player1: Player;
  private player2: Player;
  private lastSelectedPlayer: Player | null = null;
  private alreadyPlayed: { [key: string]: FightingCard[] } = {};

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;

    this.alreadyPlayed = {
      [player1.name]: [],
      [player2.name]: [],
    };
  }

  public nextCards(): FightingCard[] {
    if (this.lastSelectedPlayer == this.player1) {
      const player2NextCard = this.nextCardToPlay(this.player2);
      return [this.selectPlayerCard(this.player2, player2NextCard)];
    }

    if (this.lastSelectedPlayer == this.player2) {
      const player1NextCard = this.nextCardToPlay(this.player1);
      return [this.selectPlayerCard(this.player1, player1NextCard)];
    }

    const player1NextCard = this.nextCardToPlay(this.player1);
    const player2NextCard = this.nextCardToPlay(this.player2);

    if (player1NextCard.fasterThan(player2NextCard)) {
      return [this.selectPlayerCard(this.player1, player1NextCard)];
    }

    if (player2NextCard.fasterThan(player1NextCard)) {
      return [this.selectPlayerCard(this.player2, player2NextCard)];
    }

    this.updateAlreadyPlayedCard(this.player1, player1NextCard);
    this.updateAlreadyPlayedCard(this.player2, player2NextCard);
    return [player1NextCard, player2NextCard];
  }

  public notifyDeath(player: Player, card: FightingCard): void {
    this.updateAlreadyPlayedCard(player, card);
  }

  private nextCardToPlay(player: Player): FightingCard | null {
    const cards = player.playableCards;
    const nextCard = cards.reduce((fastestCard, card) => {
      if (card.isDead() || this.alreadyPlayed[player.name].includes(card)) {
        return fastestCard;
      }

      if (!fastestCard) {
        return card;
      }

      return card.fasterThan(fastestCard) ? card : fastestCard;
    }, null);

    return nextCard;
  }

  private selectPlayerCard(
    player: Player,
    nextCard: FightingCard,
  ): FightingCard {
    this.lastSelectedPlayer = player;
    this.updateAlreadyPlayedCard(player, nextCard);

    return nextCard;
  }

  private updateAlreadyPlayedCard(
    player: Player,
    card: FightingCard | null,
  ): void {
    if (card) {
      this.alreadyPlayed[player.name].push(card);
    }

    const aliveCards = player.playableCards;
    if (aliveCards.every((c) => this.alreadyPlayed[player.name].includes(c))) {
      this.alreadyPlayed[player.name] = [];
    }
  }
}
