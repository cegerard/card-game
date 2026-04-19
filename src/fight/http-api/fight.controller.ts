import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { FightResult } from '../core/fight-simulator/@types/fight-result';
import {
  CardSelectorStrategy,
  Effect,
  FightDataDto,
  FightingCardDto,
  OtherSkillDto,
  SpecialKind,
  SkillKind,
  BuffType,
  TriggerEvent,
  TargetingStrategy,
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
import { AlterationSkill } from '../core/cards/skills/alteration-skill';
import { buildTriggerStrategy } from './trigger-factory';
import { Trigger } from '../core/trigger/trigger';
import { PoisonAttackEffect } from '../core/cards/@types/attack/attack-poison-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnAttackEffect } from '../core/cards/@types/attack/attack-burn-effect';
import { FreezeAttackEffect } from '../core/cards/@types/attack/attack-freeze-effect';
import { EffectTriggeredDebuff } from '../core/cards/@types/attack/effect-triggered-debuff';
import { MathRandomizer } from '../tools/math-randomizer';
import { BuffApplication } from '../core/cards/@types/buff/buff-application';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from '../core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from '../core/fight-simulator/card-selectors/speed-weighted-card-pool';
import { Player } from '../core/player';
import { FightSimulator } from '../core/fight-simulator/@types/fight-simulator';
import { Skill } from '../core/cards/skills/skill';
import { TargetingOverrideSkill } from '../core/cards/skills/targeting-override';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ConditionalAttack } from '../core/cards/skills/conditional-attack';
import { EveryNTurnsCondition } from '../core/cards/@types/attack/conditions/every-n-turns-condition';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { AttackSkill } from '../core/cards/skills/attack-skill';
import { TargetedCard } from '../core/targeting-card-strategies/targeted-card';
import { validatePowerIdConsistency } from '../core/cards/skills/power-id-consistency';

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
            b.terminationEvent,
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
    } else if (cardData.skills.special.kind === SpecialKind.HEALING) {
      special = new SpecialHealing(
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
      );
    } else {
      throw new Error(`Unknown SpecialKind: ${cardData.skills.special.kind}`);
    }

    let attackSkill: AttackSkill;

    if (cardData.skills.multipleAttack) {
      const ma = cardData.skills.multipleAttack;
      const maDamages = ma.damages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      const maEffect = ma.effect ? this.buildEffect(ma.effect) : undefined;
      const maComboFinisher = ma.comboFinisher
        ? ma.comboFinisher.map((d) => new DamageComposition(d.type, d.rate))
        : undefined;
      attackSkill = new MultipleAttack(
        ma.hits,
        maDamages,
        buildTargetingStrategy(ma.targetingStrategy),
        ma.amplifier ?? 0,
        maEffect,
        maComboFinisher,
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

    try {
      validatePowerIdConsistency(
        cardData.skills.others.map((s) => ({
          powerId: s.powerId,
          event: s.event,
          terminationEvent: s.terminationEvent,
        })),
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    const otherSkills: Skill[] = cardData.skills.others.map((skill) =>
      this.createOtherSkill(skill),
    );

    return new FightingCard(
      cardData.id,
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
    terminationEvent?: string;
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
        return new PoisonAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
          effectDto.terminationEvent,
        );
      case Effect.BURN:
        return new BurnAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
          effectDto.terminationEvent,
        );
      case Effect.FREEZE:
        return new FreezeAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          triggeredDebuff,
          effectDto.terminationEvent,
        );
    }
  }

  private buildTriggerForSkill(skillData: OtherSkillDto): Trigger {
    const dormantConfig =
      skillData.event === TriggerEvent.DORMANT
        ? {
            activationEvent: skillData.activationEvent,
            activationTargetCardId: skillData.activationTargetCardId,
            replacementEvent: skillData.replacementEvent,
          }
        : undefined;
    return buildTriggerStrategy(
      skillData.event,
      skillData.targetCardId,
      dormantConfig,
    );
  }

  private createOtherSkill(skillData: OtherSkillDto): Skill {
    switch (skillData.kind) {
      case SkillKind.HEALING:
        return new Healing(
          skillData.rate,
          this.buildTriggerForSkill(skillData),
          buildTargetingStrategy(skillData.targetingStrategy),
          skillData.powerId,
        );
      case SkillKind.BUFF:
      case SkillKind.DEBUFF:
        if (!skillData.buffType) {
          throw new Error('Alteration skill requires buffType');
        }
        const alterationCondition = skillData.activationCondition
          ? buildBuffCondition(skillData.activationCondition.type, {
              threshold: skillData.activationCondition.threshold,
              operator: skillData.activationCondition.operator,
            })
          : undefined;
        // duration: 0 means infinite — either permanent (no terminationEvent)
        // or event-bound (removed when terminationEvent fires via EndEventProcessor).
        // The domain uses Infinity to bypass the turn-decrement filter.
        const alterationDuration =
          skillData.duration === 0 ? Infinity : (skillData.duration ?? 0);
        return new AlterationSkill({
          polarity: skillData.kind === SkillKind.BUFF ? 'buff' : 'debuff',
          attributeType: this.mapBuffType(skillData.buffType),
          rate: skillData.rate,
          duration: alterationDuration,
          trigger: this.buildTriggerForSkill(skillData),
          targetingStrategy: buildTargetingStrategy(
            skillData.targetingStrategy,
          ),
          activationCondition: alterationCondition,
          activationLimit: skillData.activationLimit,
          endEvent: skillData.endEvent,
          terminationEvent: skillData.terminationEvent,
          powerId: skillData.powerId,
        });
      case SkillKind.CONDITIONAL_ATTACK:
        const caDamages = skillData.damages.map(
          (d) => new DamageComposition(d.type, d.rate),
        );
        const caEffect = skillData.effect
          ? this.buildEffect(skillData.effect)
          : undefined;
        const caComboFinisher = skillData.comboFinisher
          ? skillData.comboFinisher.map(
              (d) => new DamageComposition(d.type, d.rate),
            )
          : undefined;
        const caAttackSkill = skillData.hits
          ? new MultipleAttack(
              skillData.hits,
              caDamages,
              buildTargetingStrategy(skillData.targetingStrategy),
              skillData.amplifier ?? 0,
              caEffect,
              caComboFinisher,
            )
          : new SimpleAttack(
              caDamages,
              buildTargetingStrategy(skillData.targetingStrategy),
              caEffect,
            );
        return new ConditionalAttack(
          caAttackSkill,
          new EveryNTurnsCondition(skillData.interval),
          this.buildTriggerForSkill(skillData),
        );
      case SkillKind.TARGETING_OVERRIDE:
        if (!skillData.terminationEvent) {
          throw new Error('Targeting override skill requires terminationEvent');
        }
        if (skillData.targetingStrategy === TargetingStrategy.TARGETED_CARD) {
          return new TargetingOverrideSkill(
            undefined,
            skillData.terminationEvent,
            this.buildTriggerForSkill(skillData),
            skillData.powerId,
            (ctx) => {
              if (!ctx.killerCard) return null;
              return new TargetedCard(ctx.killerCard.id);
            },
          );
        }
        return new TargetingOverrideSkill(
          buildTargetingStrategy(skillData.targetingStrategy),
          skillData.terminationEvent,
          this.buildTriggerForSkill(skillData),
          skillData.powerId,
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

    const result = BUFF_TYPE_MAP[buffType];
    if (!result) throw new Error(`Unknown buff type: ${buffType}`);
    return result;
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

    const result = STRATEGY_MAP[cardSelectorStrategy];
    if (!result)
      throw new Error(
        `Unknown card selector strategy: ${cardSelectorStrategy}`,
      );
    return result;
  }
}
