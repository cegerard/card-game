import { FightSimulator } from 'src/fight/core/fight-simulator/@types/fight-simulator';
import { FightingCard } from '../../core/cards/fighting-card';
import { FightResult } from '../../core/fight-simulator/@types/fight-result';
import { Player } from 'src/fight/core/player';
import { CardSelector } from 'src/fight/core/fight-simulator/card-selectors/card-selector';

export class FightSimulatorStub implements FightSimulator {
  constructor(
    private readonly player1: Player,
    private readonly cardSelector: CardSelector,
  ) {}

  public start(): FightResult {
    return {};
  }

  public validatePlayer1FirstCard(test: (card: FightingCard) => void): void {
    test(this.player1.allCards[0]);
  }

  public validateCardSelectorStrategy(
    test: (cardSelector: CardSelector) => void,
  ): void {
    test(this.cardSelector);
  }
}
