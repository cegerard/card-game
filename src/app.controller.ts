import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { FightResult } from './core/fight-simulator/@types/fight-result';
import { FightDataDto } from './dto/fight-data.dto';
import { FightingCard } from './core/cards/fighting-card';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('fight')
  @HttpCode(200)
  startFight(@Body() fightData: FightDataDto): FightResult {
    const player1Deck = fightData.player1.deck.map(
      (cardData) => new FightingCard(cardData.name, cardData),
    );
    const player2Deck = fightData.player2.deck.map(
      (cardData) => new FightingCard(cardData.name, cardData),
    );
    return this.appService.simulateFight(
      { name: fightData.player1.name, deck: player1Deck },
      { name: fightData.player2.name, deck: player2Deck },
    );
  }
}
