import { FightingCard } from 'src/core/cards/fighting-card';
import { CardSelector } from './card-selector';

export class SpeedWeightedCardSelector implements CardSelector {
  private cards: FightingCard[];
  private cardPool: FightingCard[] = [];

  constructor(cards: FightingCard[]) {
    this.cards = cards;
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
    const weights = this.calculateWeights();
    for (let i = 0; i < this.cards.length; i++) {
      for (let j = 0; j < weights[i]; j++) {
        this.cardPool.push(this.cards[i]);
      }
    }
    this.shufflePool();
  }

  private calculateWeights(): number[] {
    const speeds = this.cards.map((card) => card.actualSpeed);
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
