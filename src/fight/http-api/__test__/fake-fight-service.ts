import { FightingCard } from '../../core/cards/fighting-card';
import { FightResult } from '../../core/fight-simulator/@types/fight-result';
import { FightService } from '../fight.service';

export class FakeFightService extends FightService {
  private player1Name: string = '';
  private player2Name: string = '';
  private player1Deck: FightingCard[] = [];
  private player2Deck: FightingCard[] = [];

  public simulateFight(
    player1Data: { name: string; deck: FightingCard[] },
    player2Data: { name: string; deck: FightingCard[] },
    _cardSelectorStrategy: string,
  ): FightResult {
    this.player1Name = player1Data.name;
    this.player2Name = player2Data.name;
    this.player1Deck = player1Data.deck;
    this.player2Deck = player2Data.deck;

    return [];
  }

  public playersNthCardValidate(
    playerName: string,
    cardIndex: number,
    test: (card: FightingCard) => void,
  ): void {
    if (playerName === this.player1Name) {
      return test(this.player1Deck[cardIndex]);
    } else if (playerName === this.player2Name) {
      return test(this.player2Deck[cardIndex]);
    }

    throw new Error(`Player ${playerName} not found`);
  }
}
