import { FightingCard } from './cards/fighting-card';

export class Player {
  private cards: FightingCard[];
  private alreadyPlayed: FightingCard[] = [];
  public name: string;

  constructor(name: string, cards: FightingCard[]) {
    this.name = name;
    this.cards = cards;
  }

  public nextCardToPlay(): FightingCard | null {
    const nextCard = this.cards.reduce((fastestCard, card) => {
      if (card.isDead() || this.alreadyPlayed.includes(card)) {
        return fastestCard;
      }

      if (!fastestCard) {
        return card;
      }

      return card.fasterThan(fastestCard) ? card : fastestCard;
    }, null);

    return nextCard;
  }

  public targetedCard(position: number): FightingCard | null {
    const card = this.cards[position];

    if (card.isDead()) {
      // check if there is a card alive after the dead card and go back to the first alive card
      const nextCard =
        this.cards.slice(position + 1).find((c) => !c.isDead()) ||
        this.cards.slice(0, position).find((c) => !c.isDead());
      if (nextCard) {
        return nextCard;
      }

      return null;
    }

    return card;
  }

  public cardPosition(card: FightingCard): number {
    return this.cards.indexOf(card);
  }

  public ownCard(card: FightingCard): boolean {
    return this.cards.includes(card);
  }

  public status(): number {
    return this.cards.reduce((status, card) => status + card.actualHealth, 0);
  }

  public updateAlreadyPlayedCard(card: FightingCard | null): void {
    if (card) {
      this.alreadyPlayed.push(card);
    }

    const aliveCards = this.cards.filter((c) => !c.isDead());
    if (aliveCards.every((c) => this.alreadyPlayed.includes(c))) {
      this.alreadyPlayed = [];
    }
  }

  public notifyDeath(card: FightingCard): void {
    this.updateAlreadyPlayedCard(card);
  }
}
