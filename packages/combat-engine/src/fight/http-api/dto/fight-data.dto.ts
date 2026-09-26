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
  Max,
  IsPositive,
  IsBoolean,
  IsNotIn,
  IsIn,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';

export enum AlterationConditionType {
  ALLY_PRESENCE = 'ally-presence',
  HEALTH_THRESHOLD = 'health-threshold',
  PROBABILITY = 'probability',
}

class BuffConditionDto {
  @IsEnum(AlterationConditionType)
  type: AlterationConditionType;

  @IsOptional()
  @IsString()
  allyName?: string;

  @IsOptional()
  @IsNumber()
  multiplier?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  threshold?: number;

  @IsOptional()
  @IsIn(['below', 'above'])
  operator?: string;

  // PROBABILITY condition only: activation chance of the skill
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  probability?: number;
}
import { DamageType } from '../../core/cards/@types/damage/damage-type';
export { DamageType };

export enum SpecialKind {
  ATTACK = 'ATTACK',
  HEALING = 'HEALING',
}

export enum SkillKind {
  HEALING = 'HEALING',
  ALTERATION = 'ALTERATION',
  CONDITIONAL_ATTACK = 'CONDITIONAL_ATTACK',
  TARGETING_OVERRIDE = 'TARGETING_OVERRIDE',
  SHIELD = 'SHIELD',
  SURVIVE = 'SURVIVE',
  DAMAGE_REDUCTION = 'DAMAGE_REDUCTION',
  TRANSFORMATION = 'TRANSFORMATION',
}

export enum BuffType {
  ATTACK = 'attack',
  DEFENSE = 'defense',
  AGILITY = 'agility',
  ACCURACY = 'accuracy',
  SPEED = 'speed',
  CRITICAL_CHANCE = 'criticalChance',
  REGENERATION = 'regeneration',
  RESISTANCE = 'resistance',
}

export enum Effect {
  POISON = 'POISON',
  BURN = 'BURN',
  FREEZE = 'FREEZE',
  STUNT = 'STUNT',
  MARK = 'MARK',
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
  SURVIVED = 'survived',
  ALLY_HEALTH_BELOW = 'ally-health-below',
  DAMAGE_TAKEN = 'damage-taken',
  ANY_ALLY_HEALTH_BELOW = 'any-ally-health-below',
}

export enum TargetingStrategy {
  POSITION_BASED = 'position-based',
  TARGET_ALL = 'target-all',
  LINE_THREE = 'line-three',
  ALL_OWNER_CARD = 'all-owner-cards',
  ALL_ALLIES = 'all-allies',
  SELF = 'self',
  TARGETED_CARD = 'targeted-card',
  LAST_ATTACKER_OF_ALLY = 'last-attacker-of-ally',
  LINKED_ALLY = 'linked-ally',
  MOST_WOUNDED_ALLY = 'most-wounded-ally',
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
  // Stack budget: both fields together, or neither
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stackId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxStacks?: number;

  @IsEnum(BuffType)
  debuffType: BuffType;

  @IsNumber()
  debuffRate: number;

  @IsNumber()
  duration: number;

  @IsNumber()
  probability: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  powerId?: string;
}

export class EffectDto {
  @IsEnum(Effect)
  type: Effect;

  @IsNumber()
  rate: number;

  @ValidateIf((o) => o.type !== Effect.MARK)
  @IsDefined()
  @IsNumber()
  level?: number;

  @ValidateIf((o) => o.type === Effect.MARK)
  @IsDefined()
  @IsEnum(DamageType)
  damageType?: DamageType;

  @ValidateIf((o) => o.type === Effect.MARK)
  @IsDefined()
  @IsNumber()
  @Min(1)
  maxStacks?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  stacks?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectTriggeredDebuffDto)
  triggeredDebuff?: EffectTriggeredDebuffDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;

  @IsOptional()
  @IsNumber()
  probability?: number;
}

class StatAlterationDto {
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

  @IsIn(['buff', 'debuff'])
  polarity: 'buff' | 'debuff';

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BuffConditionDto)
  condition?: BuffConditionDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;
}

class ShieldApplicationDto {
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
}

class MarkedTargetBonusDto {
  @IsEnum(DamageType)
  damageType: DamageType;

  @IsNumber()
  @IsPositive()
  multiplier: number;
}

export enum StatusCategoryDto {
  CONTROL = 'control',
  DAMAGE_OVER_TIME = 'damage-over-time',
}

class StanceActivationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(1)
  duration: number;

  // Status categories the caster refuses while the stance runs
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(StatusCategoryDto, { each: true })
  immunities?: StatusCategoryDto[];
}

class SpecialDto {
  @IsEnum(SpecialKind)
  kind: SpecialKind;

  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages?: DamageCompositionDto[];

  @IsOptional()
  @IsNumber()
  rate?: number;

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
  @Type(/* istanbul ignore next */ () => StatAlterationDto)
  statAlterations?: StatAlterationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => ShieldApplicationDto)
  shieldApplication?: ShieldApplicationDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => MarkedTargetBonusDto)
  markedTargetBonus?: MarkedTargetBonusDto;

  // Opens a named stance on the caster for a number of turns; skills carrying
  // requiresStance with that name are only active while it runs
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => StanceActivationDto)
  stanceActivation?: StanceActivationDto;
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  effects?: EffectDto[];
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  effects?: EffectDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  comboFinisher?: DamageCompositionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  comboFinisherEffects?: EffectDto[];
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

  // Required for HEALING, ALTERATION, SHIELD; not applicable to CONDITIONAL_ATTACK or TARGETING_OVERRIDE
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.HEALING ||
      o.kind === SkillKind.ALTERATION ||
      o.kind === SkillKind.SHIELD ||
      o.kind === SkillKind.DAMAGE_REDUCTION,
  )
  @IsDefined()
  @IsNumber()
  rate?: number;

  @ValidateIf(
    (o) =>
      o.kind !== SkillKind.SURVIVE &&
      o.kind !== SkillKind.TRANSFORMATION &&
      o.kind !== SkillKind.DAMAGE_REDUCTION,
  )
  @IsDefined()
  @IsEnum(TargetingStrategy)
  targetingStrategy: TargetingStrategy;

  @ValidateIf(
    (o) =>
      o.kind !== SkillKind.SHIELD &&
      o.kind !== SkillKind.SURVIVE &&
      o.kind !== SkillKind.TRANSFORMATION &&
      o.kind !== SkillKind.DAMAGE_REDUCTION,
  )
  @IsDefined()
  @IsEnum(TriggerEvent)
  event?: TriggerEvent;

  // DAMAGE_REDUCTION: per-hit roll; omit for a permanent reduction
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  probability?: number;

  // Only active while its owner holds the named stance
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  requiresStance?: string;

  // ALTERATION debuff stack budget: both fields together, or neither
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stackId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  debuffMaxStacks?: number;

  // Required for ALTERATION kind
  @ValidateIf((o) => o.kind === SkillKind.ALTERATION)
  @IsDefined()
  @IsEnum(BuffType)
  buffType?: BuffType;

  @ValidateIf(
    (o) =>
      o.kind === SkillKind.ALTERATION || o.kind === SkillKind.TRANSFORMATION,
  )
  @IsDefined()
  @IsNumber()
  duration?: number;

  @ValidateIf((o) => o.kind === SkillKind.ALTERATION)
  @IsDefined()
  @IsIn(['buff', 'debuff'])
  polarity?: 'buff' | 'debuff';

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BuffConditionDto)
  activationCondition?: BuffConditionDto;

  // TRANSFORMATION kind
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => StatAlterationDto)
  statAlterations?: StatAlterationDto[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  lifestealRate?: number;

  @IsOptional()
  @IsBoolean()
  statusImmunity?: boolean;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  endCostRate?: number;

  // Required for CONDITIONAL_ATTACK kind
  @ValidateIf((o) => o.kind === SkillKind.CONDITIONAL_ATTACK)
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages?: DamageCompositionDto[];

  @ValidateIf(
    (o) =>
      o.kind === SkillKind.CONDITIONAL_ATTACK &&
      o.event !== TriggerEvent.ALLY_HEALTH_BELOW &&
      o.event !== TriggerEvent.DAMAGE_TAKEN,
  )
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  comboFinisherEffects?: EffectDto[];

  // Required when event is ally-death, enemy-death, ally-health-below or
  // damage-taken
  @ValidateIf(
    (o) =>
      o.event === TriggerEvent.ALLY_DEATH ||
      o.event === TriggerEvent.ENEMY_DEATH ||
      o.event === TriggerEvent.ALLY_HEALTH_BELOW ||
      o.event === TriggerEvent.DAMAGE_TAKEN,
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

  /** Health points restored to itself at each turn end. Defaults to 0. */
  @IsOptional()
  @IsNumber()
  regeneration?: number;

  /** Drives the chance to refuse an incoming status or debuff. Defaults to 0. */
  @IsOptional()
  @IsNumber()
  resistance?: number;

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
