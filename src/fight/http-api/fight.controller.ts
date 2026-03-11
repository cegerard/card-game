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
  SkillKind,
  BuffType,
} from './dto/fight-data.dto';
import { FightingCard } from '../core/cards/fighting-card';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildDodgeStrategy } from './dodge-strategy-factory';
import { buildBuffCondition } from './buff-condition-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { Healing } from '../core/cards/skills/healing';
import { BuffSkill } from '../core/cards/skills/buff-skill';
import { buildTriggerStrategy } from './trigger-factory';
import { PoisonedAttackEffect } from '../core/cards/@types/attack/attack-poisoned-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnedAttackEffect } from '../core/cards/@types/attack/attack-burned-effect';
import { FrozenAttackEffect } from '../core/cards/@types/attack/attack-frozen-effect';
import { EffectTriggeredDebuff } from '../core/cards/@types/attack/effect-triggered-debuff';
import { MathRandomizer } from '../tools/math-randomizer';
import { BuffApplication } from '../core/cards/@types/buff/buff-application';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from '../core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from '../core/fight-simulator/card-selectors/speed-weighted-card-pool';
import { Player } from '../core/player';
import { FightSimulator } from '../core/fight-simulator/@types/fight-simulator';
import { Skill } from '../core/cards/skills/skill';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ConditionalAttack } from '../core/cards/skills/conditional-attack';
import { EveryNTurnsCondition } from '../core/cards/@types/attack/conditions/every-n-turns-condition';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { AttackSkill } from '../core/cards/skills/attack-skill';

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
    const player1Deck = fightData.player1.deck.map((card) =>
      this.convertCardDtoToCard(card),
    );
    const player2Deck = fightData.player2.deck.map((card) =>
      this.convertCardDtoToCard(card),
    );

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

    const specialEffect = cardData.skills.special.effect
      ? this.buildEffect(cardData.skills.special.effect)
      : undefined;

    if (cardData.skills.special.kind === SpecialKind.ATTACK) {
      let buffApplication;
      if (cardData.skills.special.buffApplication) {
        buffApplication = cardData.skills.special.buffApplication.map((b) => {
          const condition = b.condition
            ? buildBuffCondition(b.condition.type, {
                allyName: b.condition.allyName,
              })
            : undefined;
          return new BuffApplication(
            this.mapBuffType(b.type),
            b.rate,
            b.duration,
            buildTargetingStrategy(b.targetingStrategy),
            condition,
            b.condition?.multiplier,
          );
        });
      }

      special = new SpecialAttack(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
        specialEffect,
        buffApplication,
      );
    }

    if (cardData.skills.special.kind === SpecialKind.HEALING) {
      special = new SpecialHealing(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
      );
    }

    let attackSkill: AttackSkill;

    if (cardData.skills.multipleAttack) {
      const ma = cardData.skills.multipleAttack;
      const maDamages = ma.damages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      const maEffect = ma.effect ? this.buildEffect(ma.effect) : undefined;
      attackSkill = new MultipleAttack(
        ma.hits,
        maDamages,
        buildTargetingStrategy(ma.targetingStrategy),
        ma.amplifier ?? 0,
        maEffect,
      );
    } else {
      const sa = cardData.skills.simpleAttack;
      if (!sa) {
        throw new Error(
          'Either simpleAttack or multipleAttack must be provided',
        );
      }
      const effect = sa.effect ? this.buildEffect(sa.effect) : undefined;
      const damages = sa.damages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      attackSkill = new SimpleAttack(
        damages,
        buildTargetingStrategy(sa.targetingStrategy),
        effect,
      );
    }

    const otherSkills: Skill[] = cardData.skills.others.map((skill) =>
      this.createOtherSkill(skill),
    );

    return new FightingCard(
      cardData.name,
      cardData,
      {
        special,
        simpleAttack: attackSkill,
        others: otherSkills,
      },
      {
        dodge: buildDodgeStrategy(cardData.behaviors.dodge),
      },
    );
  }

  private buildEffect(effectDto: {
    type: Effect;
    rate: number;
    level: number;
    triggeredDebuff?: {
      debuffType: BuffType;
      debuffRate: number;
      duration: number;
      probability: number;
    };
  }): AttackEffect {
    const triggeredDebuff = effectDto.triggeredDebuff
      ? new EffectTriggeredDebuff(
          effectDto.triggeredDebuff.probability,
          this.mapBuffType(effectDto.triggeredDebuff.debuffType),
          effectDto.triggeredDebuff.debuffRate,
          effectDto.triggeredDebuff.duration,
          new MathRandomizer(),
        )
      : undefined;

    switch (effectDto.type) {
      case Effect.POISON:
        return new PoisonedAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
        );
      case Effect.BURN:
        return new BurnedAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
        );
      case Effect.FREEZE:
        return new FrozenAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
        );
    }
  }

  private createOtherSkill(skillData: any): Skill {
    switch (skillData.kind) {
      case SkillKind.HEALING:
        return new Healing(
          skillData.rate,
          buildTriggerStrategy(skillData.event),
          buildTargetingStrategy(skillData.targetingStrategy),
        );
      case SkillKind.BUFF:
        if (!skillData.buffType || !skillData.duration) {
          throw new Error('Buff skill requires buffType and duration');
        }
        const activationCondition = skillData.activationCondition
          ? buildBuffCondition(skillData.activationCondition.type, {
              threshold: skillData.activationCondition.threshold,
              operator: skillData.activationCondition.operator,
            })
          : undefined;
        return new BuffSkill(
          this.mapBuffType(skillData.buffType),
          skillData.rate,
          skillData.duration,
          buildTriggerStrategy(skillData.event),
          buildTargetingStrategy(skillData.targetingStrategy),
          activationCondition,
        );
      case SkillKind.CONDITIONAL_ATTACK:
        if (!skillData.damages || !skillData.interval) {
          throw new Error('Conditional attack requires damages and interval');
        }
        const caDamages = skillData.damages.map(
          (d) => new DamageComposition(d.type, d.rate),
        );
        const caEffect = skillData.effect
          ? this.buildEffect(skillData.effect)
          : undefined;
        const caAttackSkill = skillData.hits
          ? new MultipleAttack(
              skillData.hits,
              caDamages,
              buildTargetingStrategy(skillData.targetingStrategy),
              skillData.amplifier ?? 0,
              caEffect,
            )
          : new SimpleAttack(
              caDamages,
              buildTargetingStrategy(skillData.targetingStrategy),
              caEffect,
            );
        return new ConditionalAttack(
          caAttackSkill,
          new EveryNTurnsCondition(skillData.interval),
        );
      default:
        throw new Error(`Unknown skill kind: ${skillData.kind}`);
    }
  }

  private mapBuffType(
    buffType: BuffType,
  ): import('../core/cards/@types/buff/type').BuffType {
    const BUFF_TYPE_MAP = {
      [BuffType.ATTACK]: 'attack' as const,
      [BuffType.DEFENSE]: 'defense' as const,
      [BuffType.AGILITY]: 'agility' as const,
      [BuffType.ACCURACY]: 'accuracy' as const,
    };

    return BUFF_TYPE_MAP[buffType];
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
