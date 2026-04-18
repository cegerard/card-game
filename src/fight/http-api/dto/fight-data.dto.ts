import { Type } from 'class-transformer';
import {
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsDefined,
  ValidateIf,
  Min,
  IsNotIn,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

export enum BuffConditionType {
  ALLY_PRESENCE = 'ally-presence',
  HEALTH_THRESHOLD = 'health-threshold',
}

class BuffConditionDto {
  @IsEnum(BuffConditionType)
  type: BuffConditionType;

  @IsOptional()
  @IsString()
  allyName?: string;

  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @IsOptional()
  @IsNumber()
  threshold?: number;

  @IsOptional()
  @IsString()
  operator?: string;
}
import { DamageType } from '../../core/cards/@types/damage/damage-type';
export { DamageType };

export enum SpecialKind {
  ATTACK = 'ATTACK',
  HEALING = 'HEALING',
}

export enum SkillKind {
  HEALING = 'HEALING',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  CONDITIONAL_ATTACK = 'CONDITIONAL_ATTACK',
  TARGETING_OVERRIDE = 'TARGETING_OVERRIDE',
}

export enum BuffType {
  ATTACK = 'attack',
  DEFENSE = 'defense',
  AGILITY = 'agility',
  ACCURACY = 'accuracy',
}

export enum Effect {
  POISON = 'POISON',
  BURN = 'BURN',
  FREEZE = 'FREEZE',
}

export enum DodgeStrategy {
  SIMPLE_DODGE = 'simple-dodge',
  RANDOM_DODGE = 'random-dodge',
}

export enum TriggerEvent {
  TURN_END = 'turn-end',
  NEXT_ACTION = 'next-action',
  ALLY_DEATH = 'ally-death',
  ENEMY_DEATH = 'enemy-death',
  DORMANT = 'dormant',
}

export enum TargetingStrategy {
  POSITION_BASED = 'position-based',
  TARGET_ALL = 'target-all',
  LINE_THREE = 'line-three',
  ALL_OWNER_CARD = 'all-owner-cards',
  ALL_ALLIES = 'all-allies',
  SELF = 'self',
  TARGETED_CARD = 'targeted-card',
}

export enum CardSelectorStrategy {
  PLAYER_BY_PLAYER = 'player-by-player',
  SPEED_WEIGHTED = 'speed-weighted',
}

export enum ElementDto {
  PHYSICAL = 'PHYSICAL',
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  AIR = 'AIR',
}

class EffectTriggeredDebuffDto {
  @IsEnum(BuffType)
  debuffType: BuffType;

  @IsNumber()
  debuffRate: number;

  @IsNumber()
  duration: number;

  @IsNumber()
  probability: number;
}

class EffectDto {
  @IsEnum(Effect)
  type: Effect;

  @IsNumber()
  rate: number;

  @IsNumber()
  level: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectTriggeredDebuffDto)
  triggeredDebuff?: EffectTriggeredDebuffDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;
}

class BuffApplicationDto {
  @IsEnum(BuffType)
  type: BuffType;

  @IsNumber()
  rate: number;

  @IsNumber()
  duration: number;

  @IsEnum(TargetingStrategy)
  @IsNotIn([TargetingStrategy.TARGETED_CARD], {
    message:
      'targeted-card strategy can only be used with targeting override skills',
  })
  targetingStrategy: TargetingStrategy;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BuffConditionDto)
  condition?: BuffConditionDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;
}

class SpecialDto {
  @IsEnum(SpecialKind)
  kind: SpecialKind;

  @IsString()
  name: string;

  @IsNumber()
  rate: number;

  @IsNumber()
  energy: number;

  @IsEnum(TargetingStrategy)
  @IsNotIn([TargetingStrategy.TARGETED_CARD], {
    message:
      'targeted-card strategy can only be used with targeting override skills',
  })
  targetingStrategy: TargetingStrategy;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => BuffApplicationDto)
  buffApplication?: BuffApplicationDto[];
}

class DamageCompositionDto {
  @IsEnum(DamageType)
  type: DamageType;

  @IsNumber()
  @Min(0)
  rate: number;
}

class SimpleAttackDto {
  @IsString()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages: DamageCompositionDto[];

  @IsEnum(TargetingStrategy)
  @IsNotIn([TargetingStrategy.TARGETED_CARD], {
    message:
      'targeted-card strategy can only be used with targeting override skills',
  })
  targetingStrategy: TargetingStrategy;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;
}

class MultipleAttackDto {
  @IsString()
  name: string;

  @IsNumber()
  hits: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages: DamageCompositionDto[];

  @IsEnum(TargetingStrategy)
  @IsNotIn([TargetingStrategy.TARGETED_CARD], {
    message:
      'targeted-card strategy can only be used with targeting override skills',
  })
  targetingStrategy: TargetingStrategy;

  @IsOptional()
  @IsNumber()
  amplifier?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  comboFinisher?: DamageCompositionDto[];
}

@ValidatorConstraint({ name: 'targetedCardOnlyForOverride', async: false })
class TargetedCardOnlyForOverrideConstraint implements ValidatorConstraintInterface {
  validate(_value: any, args: ValidationArguments) {
    const obj = args.object as OtherSkillDto;
    if (obj.targetingStrategy === TargetingStrategy.TARGETED_CARD) {
      return obj.kind === SkillKind.TARGETING_OVERRIDE;
    }
    return true;
  }

  defaultMessage() {
    return 'targeted-card strategy can only be used with targeting override skills';
  }
}

export class OtherSkillDto {
  @IsEnum(SkillKind)
  @Validate(TargetedCardOnlyForOverrideConstraint)
  kind: SkillKind;

  @IsString()
  name: string;

  // Required for HEALING, BUFF, DEBUFF; not applicable to CONDITIONAL_ATTACK or TARGETING_OVERRIDE
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.HEALING ||
      o.kind === SkillKind.BUFF ||
      o.kind === SkillKind.DEBUFF,
  )
  @IsDefined()
  @IsNumber()
  rate?: number;

  @IsEnum(TargetingStrategy)
  targetingStrategy: TargetingStrategy;

  @IsEnum(TriggerEvent)
  event: TriggerEvent;

  // Required for BUFF and DEBUFF kinds
  @ValidateIf((o) => o.kind === SkillKind.BUFF || o.kind === SkillKind.DEBUFF)
  @IsDefined()
  @IsEnum(BuffType)
  buffType?: BuffType;

  @ValidateIf((o) => o.kind === SkillKind.BUFF || o.kind === SkillKind.DEBUFF)
  @IsDefined()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BuffConditionDto)
  activationCondition?: BuffConditionDto;

  // Required for CONDITIONAL_ATTACK kind
  @ValidateIf((o) => o.kind === SkillKind.CONDITIONAL_ATTACK)
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages?: DamageCompositionDto[];

  @ValidateIf((o) => o.kind === SkillKind.CONDITIONAL_ATTACK)
  @IsDefined()
  @IsNumber()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsNumber()
  hits?: number;

  @IsOptional()
  @IsNumber()
  amplifier?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  comboFinisher?: DamageCompositionDto[];

  // Required when event is ally-death or enemy-death
  @ValidateIf(
    (o) =>
      o.event === TriggerEvent.ALLY_DEATH ||
      o.event === TriggerEvent.ENEMY_DEATH,
  )
  @IsDefined()
  @IsString()
  targetCardId?: string;

  // Event-bound buff properties
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  activationLimit?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  endEvent?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  powerId?: string;

  @ValidateIf((o) => o.event === TriggerEvent.DORMANT)
  @IsDefined()
  @IsEnum(TriggerEvent)
  activationEvent?: TriggerEvent;

  @ValidateIf((o) => o.event === TriggerEvent.DORMANT)
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  activationTargetCardId?: string;

  @ValidateIf((o) => o.event === TriggerEvent.DORMANT)
  @IsDefined()
  @IsEnum(TriggerEvent)
  replacementEvent?: TriggerEvent;
}

class SkillsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SpecialDto)
  special: SpecialDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SimpleAttackDto)
  simpleAttack?: SimpleAttackDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => MultipleAttackDto)
  multipleAttack?: MultipleAttackDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => OtherSkillDto)
  others: OtherSkillDto[];
}

class BehaviorsDto {
  @IsEnum(DodgeStrategy)
  dodge: DodgeStrategy;
}

export class FightingCardDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  attack: number;

  @IsNumber()
  defense: number;

  @IsNumber()
  health: number;

  @IsNumber()
  speed: number;

  @IsNumber()
  agility: number;

  @IsNumber()
  accuracy: number;

  @IsNumber()
  criticalChance: number;

  @IsOptional()
  @IsEnum(ElementDto)
  element?: ElementDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SkillsDto)
  skills: SkillsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BehaviorsDto)
  behaviors: BehaviorsDto;

  @IsOptional()
  image?: string;

  @IsOptional()
  cardDeckIdentity?: string;
}

class PlayerDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => FightingCardDto)
  deck: FightingCardDto[];

  @IsString()
  name: string;
}

export class FightDataDto {
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => PlayerDto)
  player1: PlayerDto;

  @ValidateNested()
  @Type(/* istanbul ignore next */ () => PlayerDto)
  player2: PlayerDto;

  @IsEnum(CardSelectorStrategy)
  cardSelectorStrategy: CardSelectorStrategy;
}
