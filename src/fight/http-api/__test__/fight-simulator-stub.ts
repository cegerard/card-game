import { FightSimulator } from 'src/fight/core/fight-simulator/@types/fight-simulator';
import { FightingCard } from '../../core/cards/fighting-card';
import { FightResult } from '../../core/fight-simulator/@types/fight-result';
import { Player } from 'src/fight/core/player';

export class FightSimulatorStub implements FightSimulator {
  constructor(private readonly player1: Player) {}

  public start(): FightResult {
    return {};
  }

  public validatePlayer1FirstCard(test: (card: FightingCard) => void): void {
    test(this.player1.allCards[0]);
  }
}
