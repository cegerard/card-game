import { Module } from '@nestjs/common';
import { FightController } from './http-api/fight.controller';
import { CardSelector } from './core/fight-simulator/card-selectors/card-selector';
import { Player } from './core/player';
import { Fight } from './core/fight-simulator/fight';

@Module({
  imports: [],
  controllers: [FightController],
  providers: [
    {
      provide: 'FIGHT_SIMULATOR_BUILDER',
      useFactory: () => {
        return (
          player1: Player,
          player2: Player,
          cardSelector: CardSelector,
        ) => {
          return new Fight(player1, player2, cardSelector);
        };
      },
    },
  ],
})
export class FightModule {}
