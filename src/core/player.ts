import { FightingCard } from './cards/fighting-card';
import { TargetingCardStrategy } from './targeting-card-strategies/targeting-card-strategy';

export class Player {
  private cards: FightingCard[];
  public name: string;

  constructor(name: string, cards: FightingCard[]) {
    this.name = name;
    this.cards = cards;
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

  public ownCard(card: FightingCard): boolean {
    return this.cards.includes(card);
  }

  public status(): number {
    return this.cards.reduce((status, card) => status + card.actualHealth, 0);
  }
}
