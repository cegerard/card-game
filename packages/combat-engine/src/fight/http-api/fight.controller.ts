import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Inject,
} from '@nestjs/common';
import { FightResult } from '../core/fight-simulator/@types/fight-result';
import { FightDataDto } from './dto/fight-data.dto';
import { buildFightingCard } from './fighting-card-factory';
import { buildCardSelector } from './card-selector-factory';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { Player } from '../core/player';
import { FightSimulator } from '../core/fight-simulator/@types/fight-simulator';

@Controller()
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class FightController {
  constructor(
    @Inject('FIGHT_SIMULATOR_BUILDER')
    private readonly buildFightSimulator: (
      player1: Player,
      player2: Player,
      cardSelector: CardSelector,
    ) => FightSimulator,
  ) {}

  @Post('fight')
  @HttpCode(200)
  startFight(@Body() fightData: FightDataDto): FightResult {
    const player1Deck = fightData.player1.deck.map(buildFightingCard);
    const player2Deck = fightData.player2.deck.map(buildFightingCard);

    const player1 = new Player(fightData.player1.name, player1Deck);
    const player2 = new Player(fightData.player2.name, player2Deck);

    const fightSimulator = this.buildFightSimulator(
      player1,
      player2,
      buildCardSelector(fightData.cardSelectorStrategy, player1, player2),
    );

    return fightSimulator.start();
  }
}
