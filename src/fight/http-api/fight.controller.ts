import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FightService } from './fight.service';
import { FightResult } from '../core/fight-simulator/@types/fight-result';
import {
  Effect,
  FightDataDto,
  FightingCardDto,
  SpecialKind,
} from './dto/fight-data.dto';
import { FightingCard } from '../core/cards/fighting-card';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { TargetingStrategyFactory } from './targeting-strategy-factory';
import { buildDodgeStrategy } from './dodge-strategy-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { Healing } from '../core/cards/skills/healing';
import { TriggerFactory } from './trigger-factory';
import { PoisonedAttackEffect } from '../core/cards/@types/attack/attack-poisoned-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnedAttackEffect } from '../core/cards/@types/attack/attack-burned-effect';
import { FrozenAttackEffect } from '../core/cards/@types/attack/attack-frozen-effect';

@Controller()
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class FightController {
  constructor(private readonly appService: FightService) {}

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
        TargetingStrategyFactory.create(
          cardData.skills.special.targetingStrategy,
        ),
        specialEffect,
      );
    }

    if (cardData.skills.special.kind === SpecialKind.HEALING) {
      special = new SpecialHealing(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        TargetingStrategyFactory.create(
          cardData.skills.special.targetingStrategy,
        ),
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
      TargetingStrategyFactory.create(
        cardData.skills.simpleAttack.targetingStrategy,
      ),
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
            TriggerFactory.create(skill.event),
            TargetingStrategyFactory.create(skill.targetingStrategy),
          );
        }),
      },
      {
        dodge: buildDodgeStrategy(cardData.behaviors.dodge),
      },
    );
  }
}
