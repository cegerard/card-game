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
import { Randomizer } from '../core/randomizer';
import { MathRandomizer } from '../tools/math-randomizer';
import { SeededRandomizer } from '../tools/seeded-randomizer';

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
    // One randomizer per fight: every roll of the same seed replays it
    const randomizer: Randomizer =
      fightData.seed === undefined
        ? new MathRandomizer()
        : new SeededRandomizer(fightData.seed);
    const buildDeck = (deck: FightDataDto['player1']['deck']) =>
      deck.map((card) => buildFightingCard(card, randomizer));
    const player1Deck = buildDeck(fightData.player1.deck);
    const player2Deck = buildDeck(fightData.player2.deck);

    const player1 = new Player(fightData.player1.name, player1Deck);
    const player2 = new Player(fightData.player2.name, player2Deck);

    const fightSimulator = this.buildFightSimulator(
      player1,
      player2,
      buildCardSelector(
        fightData.cardSelectorStrategy,
        player1,
        player2,
        randomizer,
      ),
    );

    return fightSimulator.start();
  }
}
