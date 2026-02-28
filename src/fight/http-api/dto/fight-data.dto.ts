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
  Min,
} from 'class-validator';
import { DamageType } from '../../core/cards/@types/damage/damage-type';
export { DamageType };

export enum SpecialKind {
  ATTACK = 'ATTACK',
  HEALING = 'HEALING',
}

export enum SkillKind {
  HEALING = 'HEALING',
  BUFF = 'BUFF',
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
}

export enum TargetingStrategy {
  POSITION_BASED = 'position-based',
  TARGET_ALL = 'target-all',
  LINE_THREE = 'line-three',
  ALL_OWNER_CARD = 'all-owner-cards',
  ALL_ALLIES = 'all-allies',
  SELF = 'self',
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

class EffectDto {
  @IsEnum(Effect)
  type: Effect;

  @IsNumber()
  rate: number;

  @IsNumber()
  level: number;
}

class BuffApplicationDto {
  @IsEnum(BuffType)
  type: BuffType;

  @IsNumber()
  rate: number;

  @IsNumber()
  duration: number;

  @IsEnum(TargetingStrategy)
  targetingStrategy: TargetingStrategy;
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
  targetingStrategy: TargetingStrategy;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;
}

export class OtherSkillDto {
  @IsEnum(SkillKind)
  kind: SkillKind;

  @IsString()
  name: string;

  @IsNumber()
  rate: number;

  @IsEnum(TargetingStrategy)
  targetingStrategy: TargetingStrategy;

  @IsEnum(TriggerEvent)
  event: TriggerEvent;

  // Buff property
  @IsOptional()
  @IsEnum(BuffType)
  buffType?: BuffType;

  @IsOptional()
  @IsNumber()
  duration?: number;
}

class SkillsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SpecialDto)
  special: SpecialDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SimpleAttackDto)
  simpleAttack: SimpleAttackDto;

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
