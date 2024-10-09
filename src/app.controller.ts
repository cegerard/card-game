import { Controller, Get, Post, Body, HttpCode } from '@nestjs/common';
import { AppService } from './app.service';
import { FightResult } from './core/fight-simulator/@types/fight-result';
import { FightDataDto, FightingCardDto } from './dto/fight-data.dto';
import { FightingCard } from './core/cards/fighting-card';
import { SpecialAttack } from './core/cards/skills/special-attack';
import { SimpleAttack } from './core/cards/skills/simple-attack';
import { TargetingStrategyFactory } from './targeting-strategy-factory';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('fight')
  @HttpCode(200)
  startFight(@Body() fightData: FightDataDto): FightResult {
    const player1Deck = fightData.player1.deck.map(this.convertCardDtoToCard);
    const player2Deck = fightData.player2.deck.map(this.convertCardDtoToCard);

    return this.appService.simulateFight(
      { name: fightData.player1.name, deck: player1Deck },
      { name: fightData.player2.name, deck: player2Deck },
      fightData.cardSelectorStrategy,
    );
  }

  private convertCardDtoToCard(cardData: FightingCardDto): FightingCard {
    const specialAttack = new SpecialAttack(
      cardData.skills.specialAttack.damage,
      cardData.skills.specialAttack.energy,
      TargetingStrategyFactory.create(
        cardData.skills.specialAttack.targetingStrategy,
      ),
    );
    const simpleAttack = new SimpleAttack(
      cardData.skills.simpleAttack.damageRate,
      TargetingStrategyFactory.create(
        cardData.skills.simpleAttack.targetingStrategy,
      ),
    );
    return new FightingCard(cardData.name, cardData, {
      specialAttack,
      simpleAttack,
    });
  }
}
