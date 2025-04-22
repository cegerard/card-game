import { Injectable } from '@nestjs/common';
import { Fight } from './core/fight-simulator/fight';
import { Player } from './core/player';
import { FightResult } from './core/fight-simulator/@types/fight-result';
import { FightingCard } from './core/cards/fighting-card';
import { CardSelector } from './core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from './core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from './core/fight-simulator/card-selectors/speed-weighted-card-pool';

@Injectable()
export class FightService {
  simulateFight(
    player1Data: { name: string; deck: FightingCard[] },
    player2Data: { name: string; deck: FightingCard[] },
    cardSelectorStrategy: string,
  ): FightResult {
    // Create Player instances from the provided data
    const player1 = new Player(player1Data.name, player1Data.deck);
    const player2 = new Player(player2Data.name, player2Data.deck);

    // Create a new Fight instance
    const fight = new Fight(
      player1,
      player2,
      this.getSelectorStrategy(cardSelectorStrategy, player1, player2),
    );

    // Start the fight and return the result
    return fight.start();
  }

  private getSelectorStrategy(
    cardSelectorStrategy: string,
    player1: Player,
    player2: Player,
  ): CardSelector {
    switch (cardSelectorStrategy) {
      case 'speed-weighted':
        return new SpeedWeightedCardSelector(player1, player2);
      default:
        return new PlayerByPlayerCardSelector(player1, player2);
    }
  }
}
