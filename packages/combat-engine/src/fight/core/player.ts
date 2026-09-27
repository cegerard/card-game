import { FightingCard } from './cards/fighting-card';

export class Player {
  private cards: FightingCard[];
  public name: string;

  constructor(name: string, cards: FightingCard[]) {
    this.name = name;
    this.cards = cards;
    this.cards.forEach((card, index) => card.setOwnerInfo(name, index));
  }

  public get allCards(): FightingCard[] {
    return this.cards.slice();
  }

  public get playableCards(): FightingCard[] {
    return this.cards.filter((card) => !card.isDead());
  }

  public cardPosition(card: FightingCard): number {
    return this.cards.indexOf(card);
  }

  /**
   * The living teammate currently standing in front of that card, if any.
   * Attacks aimed at the card are resolved against the protector instead.
   */
  public protectorOf(card: FightingCard): FightingCard | undefined {
    return this.playableCards.find((teammate) => teammate.isProtecting(card));
  }

  public ownCard(card: FightingCard): boolean {
    return this.cards.includes(card);
  }

  public status(): number {
    return this.cards.reduce((status, card) => status + card.actualHealth, 0);
  }

  public threeCardsFromCenter(position: number): FightingCard[] {
    const left = this.cards[position - 1];
    const center = this.cards[position];
    const right = this.cards[position + 1];

    return [left, center, right].filter((card) => card);
  }
}
