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
import {
  CardSelectorStrategy,
  Effect,
  FightDataDto,
  FightingCardDto,
  SpecialKind,
} from './dto/fight-data.dto';
import { FightingCard } from '../core/cards/fighting-card';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildDodgeStrategy } from './dodge-strategy-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { Healing } from '../core/cards/skills/healing';
import { buildTriggerStrategy } from './trigger-factory';
import { PoisonedAttackEffect } from '../core/cards/@types/attack/attack-poisoned-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnedAttackEffect } from '../core/cards/@types/attack/attack-burned-effect';
import { FrozenAttackEffect } from '../core/cards/@types/attack/attack-frozen-effect';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from '../core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from '../core/fight-simulator/card-selectors/speed-weighted-card-pool';
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
    const player1Deck = fightData.player1.deck.map(this.convertCardDtoToCard);
    const player2Deck = fightData.player2.deck.map(this.convertCardDtoToCard);

    const player1 = new Player(fightData.player1.name, player1Deck);
    const player2 = new Player(fightData.player2.name, player2Deck);

    const fightSimulator = this.buildFightSimulator(
      player1,
      player2,
      this.getSelectorStrategy(
        fightData.cardSelectorStrategy,
        player1,
        player2,
      ),
    );

    return fightSimulator.start();
  }

  private convertCardDtoToCard(cardData: FightingCardDto): FightingCard {
    let special: Special;

    let specialEffect: AttackEffect | undefined;
    if (cardData.skills.special.effect?.type === Effect.POISON) {
      specialEffect = new PoisonedAttackEffect(
        cardData.skills.special.effect.rate,
        cardData.skills.special.effect.level as EffectLevel,
      );
    }
    if (cardData.skills.special.effect?.type === Effect.BURN) {
      specialEffect = new BurnedAttackEffect(
        cardData.skills.special.effect.rate,
        cardData.skills.special.effect.level as EffectLevel,
      );
    }
    if (cardData.skills.special.effect?.type === Effect.FREEZE) {
      specialEffect = new FrozenAttackEffect(
        cardData.skills.special.effect.rate,
        cardData.skills.special.effect.level as EffectLevel,
      );
    }

    if (cardData.skills.special.kind === SpecialKind.ATTACK) {
      special = new SpecialAttack(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
        specialEffect,
      );
    }

    if (cardData.skills.special.kind === SpecialKind.HEALING) {
      special = new SpecialHealing(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
      );
    }

    let effect: AttackEffect | undefined;
    if (cardData.skills.simpleAttack.effect?.type === Effect.POISON) {
      effect = new PoisonedAttackEffect(
        cardData.skills.simpleAttack.effect.rate,
        cardData.skills.simpleAttack.effect.level as EffectLevel,
      );
    }
    if (cardData.skills.simpleAttack.effect?.type === Effect.BURN) {
      effect = new BurnedAttackEffect(
        cardData.skills.simpleAttack.effect.rate,
        cardData.skills.simpleAttack.effect.level as EffectLevel,
      );
    }
    if (cardData.skills.simpleAttack.effect?.type === Effect.FREEZE) {
      effect = new FrozenAttackEffect(
        cardData.skills.simpleAttack.effect.rate,
        cardData.skills.simpleAttack.effect.level as EffectLevel,
      );
    }

    const simpleAttack = new SimpleAttack(
      cardData.skills.simpleAttack.damageRate,
      buildTargetingStrategy(cardData.skills.simpleAttack.targetingStrategy),
      effect,
    );

    return new FightingCard(
      cardData.name,
      cardData,
      {
        special,
        simpleAttack,
        others: cardData.skills.others.map((skill) => {
          return new Healing(
            skill.rate,
            buildTriggerStrategy(skill.event),
            buildTargetingStrategy(skill.targetingStrategy),
          );
        }),
      },
      {
        dodge: buildDodgeStrategy(cardData.behaviors.dodge),
      },
    );
  }

  private getSelectorStrategy(
    cardSelectorStrategy: CardSelectorStrategy,
    player1: Player,
    player2: Player,
  ): CardSelector {
    const STRATEGY_MAP = {
      [CardSelectorStrategy.PLAYER_BY_PLAYER]: new PlayerByPlayerCardSelector(
        player1,
        player2,
      ),
      [CardSelectorStrategy.SPEED_WEIGHTED]: new SpeedWeightedCardSelector(
        player1,
        player2,
      ),
    };

    return STRATEGY_MAP[cardSelectorStrategy];
  }
}
