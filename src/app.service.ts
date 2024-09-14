import { Injectable } from '@nestjs/common';
import { Fight } from './core/fight-simulator/fight';
import { Player } from './core/player';
import { FightResult } from './core/fight-simulator/@types/fight-result';
import { FightingCard } from './core/cards/fighting-card';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  simulateFight(
    player1Data: { deck: FightingCard[] },
    player2Data: { deck: FightingCard[] },
  ): FightResult {
    // Create Player instances from the provided data
    const player1 = new Player(player1Data.deck);
    const player2 = new Player(player2Data.deck);

    // Create a new Fight instance
    const fight = new Fight(player1, player2);

    // Start the fight and return the result
    return fight.start();
  }
}
