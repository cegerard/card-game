import { Player } from '../../player';
import { FightingCard } from '../../cards/fighting-card';
import { CardSelector } from './card-selector';

export class SpeedWeightedCardSelector implements CardSelector {
  private player1: Player;
  private player2: Player;
  private cardPool: FightingCard[] = [];

  constructor(player1: Player, player2: Player) {
    this.player1 = player1;
    this.player2 = player2;

    this.refillPool();
  }

  public nextCards(): FightingCard[] {
    if (this.cardPool.length === 0) {
      this.refillPool();
    }
    return [this.cardPool.pop()!];
  }

  private refillPool(): void {
    this.cardPool = [];
    const cards = [
      ...this.player1.playableCards,
      ...this.player2.playableCards,
    ];
    const weights = this.calculateWeights(cards);
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < weights[i]; j++) {
        this.cardPool.push(cards[i]);
      }
    }
    this.shufflePool();
  }

  private calculateWeights(cards: FightingCard[]): number[] {
    const speeds = cards.map((card) => card.actualSpeed);
    const minSpeed = Math.min(...speeds);
    return speeds.map((speed) => Math.round((speed / minSpeed) * 10));
  }

  private shufflePool(): void {
    for (let i = this.cardPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cardPool[i], this.cardPool[j]] = [
        this.cardPool[j],
        this.cardPool[i],
      ];
    }
  }
}
