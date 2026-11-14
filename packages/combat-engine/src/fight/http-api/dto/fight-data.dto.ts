import { Type } from 'class-transformer';
import {
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsInt,
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
  STANCE = 'STANCE',
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
  PROTECTION = 'PROTECTION',
  DODGE_BONUS_DENIAL = 'DODGE_BONUS_DENIAL',
  BLEED_STACK_SCALING = 'BLEED_STACK_SCALING',
  STANCE = 'STANCE',
  BLEED_EMPOWERMENT = 'BLEED_EMPOWERMENT',
  BLEED_DETONATION = 'BLEED_DETONATION',
  CONCEALMENT = 'CONCEALMENT',
  LOW_HEALTH_TARGET_BONUS = 'LOW_HEALTH_TARGET_BONUS',
  BUFF_TRANSFER = 'BUFF_TRANSFER',
  POISONED_ENEMY_AGILITY = 'POISONED_ENEMY_AGILITY',
  ATTACKER_INSIGHT = 'ATTACKER_INSIGHT',
  SPECIAL_ECHO = 'SPECIAL_ECHO',
  REAL_DAMAGE = 'REAL_DAMAGE',
  AFFLICTION = 'AFFLICTION',
  ANALYSIS = 'ANALYSIS',
  AFTERSHOCK = 'AFTERSHOCK',
  WEAK_POINT_LEGACY = 'WEAK_POINT_LEGACY',
  SUPPORT = 'SUPPORT',
  ENERGY_GAIN = 'ENERGY_GAIN',
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
  BLEED = 'BLEED',
  WEAK_POINT = 'WEAK_POINT',
  HYPOTHERMIA = 'HYPOTHERMIA',
  ENTANGLE = 'ENTANGLE',
  ENERGY_DRAIN = 'ENERGY_DRAIN',
  VULNERABILITY = 'VULNERABILITY',
  SUPPORT_BLOCK = 'SUPPORT_BLOCK',
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
  SELF_DEATH = 'self-death',
  ENEMY_BLEED_DEATH = 'enemy-bleed-death',
  TURN_START = 'turn-start',
  BLEED_STACKS_APPLIED = 'bleed-stacks-applied',
  FIGHT_START = 'fight-start',
  ENEMY_KILLED = 'enemy-killed',
  DODGE = 'dodge',
  POISONED_ENEMY_DEATH = 'poisoned-enemy-death',
  ENEMY_ATTACK = 'enemy-attack',
  AFTER_ATTACK = 'after-attack',
  TRANSFORMED = 'transformed',
  ENEMIES_ANALYSED = 'enemies-analysed',
  ANY_ALLY_DEATH = 'any-ally-death',
  ALLY_SKILL_USED = 'ally-skill-used',
}

export enum RateBasisDto {
  SOURCE_ATTACK = 'source-attack',
  TARGET_MAX_HEALTH = 'target-max-health',
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
  PROTECTED_ALLY = 'protected-ally',
  FIRST_BLEEDING_ENEMY = 'first-bleeding-enemy',
  FASTEST_ALLY = 'fastest-ally',
  LAST_DODGED_ATTACKER = 'last-dodged-attacker',
  LOWEST_HEALTH_ALLY = 'lowest-health-ally',
  RANDOM_ENEMIES = 'random-enemies',
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

export class EffectTriggeredDebuffDto {
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
  @Min(0)
  @Max(1)
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

function isStackedPoison(o: EffectDto): boolean {
  return o.type === Effect.POISON && o.maxStacks !== undefined;
}

// Control effects: no level and no triggered debuff
export const CONTROL_EFFECTS = [
  Effect.ENTANGLE,
  Effect.ENERGY_DRAIN,
  Effect.VULNERABILITY,
  Effect.SUPPORT_BLOCK,
];

// Effects counted without a level
const LEVELLESS_EFFECTS = [
  Effect.MARK,
  Effect.BLEED,
  Effect.WEAK_POINT,
  Effect.HYPOTHERMIA,
  ...CONTROL_EFFECTS,
];

// Declared below: an alias keeps the decorator metadata from reading
// EffectDto before the class exists (the two DTOs nest each other).
type ExploitEffectDto = EffectDto;

// A weakness revealed on the defender, the attacker being its revealer
export class WeakPointDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Turns it lasts; omitted, it never expires
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  // Multiplies the damage of every hit on the bearer
  @IsOptional()
  @IsNumber()
  @IsPositive()
  damageMultiplier?: number;

  // Added to the critical chance of every attacker of the bearer
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  criticalChanceBonus?: number;

  // Gone at the next attack aimed at the bearer, landed or dodged
  @IsOptional()
  @IsBoolean()
  consumable?: boolean;

  // Revealer only: share of its base accuracy added against the bearer
  @IsOptional()
  @IsNumber()
  @Min(0)
  revealerAccuracyRate?: number;

  // Revealer only: its attack against the bearer is multiplied by 1 + rate
  @IsOptional()
  @IsNumber()
  @Min(0)
  revealerAttackRate?: number;

  // Revealer only: its hits on the bearer are multiplied by 1 + rate
  @IsOptional()
  @IsNumber()
  @Min(0)
  revealerDamageRate?: number;

  // Consumable only: laid by the revealer when a hit lands on it
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  exploitEffect?: ExploitEffectDto;
}

export class EffectDto {
  @IsEnum(Effect)
  type: Effect;

  @IsNumber()
  rate: number;

  @ValidateIf((o) => !LEVELLESS_EFFECTS.includes(o.type) && !isStackedPoison(o))
  @IsDefined()
  @IsNumber()
  level?: number;

  // Required for BLEED, stacked POISON, HYPOTHERMIA, VULNERABILITY and SUPPORT_BLOCK
  @ValidateIf(
    (o) =>
      o.type === Effect.BLEED ||
      o.type === Effect.HYPOTHERMIA ||
      o.type === Effect.VULNERABILITY ||
      o.type === Effect.SUPPORT_BLOCK ||
      isStackedPoison(o),
  )
  @IsDefined()
  @IsNumber()
  @Min(1)
  duration?: number;

  // BLEED and stacked POISON: what the rate is a share of (default source-attack)
  @IsOptional()
  @IsEnum(RateBasisDto)
  basis?: RateBasisDto;

  @ValidateIf((o) => o.type === Effect.MARK || o.type === Effect.VULNERABILITY)
  @IsDefined()
  @IsEnum(DamageType)
  damageType?: DamageType;

  // POISON: given, the poison is counted in stacks instead of levels
  @ValidateIf(
    (o) =>
      o.type === Effect.MARK ||
      o.type === Effect.BLEED ||
      o.maxStacks !== undefined,
  )
  @IsDefined()
  @IsNumber()
  @Min(1)
  maxStacks?: number;

  // Stacked POISON only: what each stack multiplies the tick by
  @ValidateIf((o) => isStackedPoison(o))
  @IsDefined()
  @IsNumber()
  @IsPositive()
  stackMultiplier?: number;

  // Stacked POISON only: lays the poison through a damage-over-time immunity
  @IsOptional()
  @IsBoolean()
  ignoresImmunity?: boolean;

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

  @ValidateIf((o) => o.type === Effect.WEAK_POINT)
  @IsDefined()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => WeakPointDto)
  weakPoint?: WeakPointDto;
}

// Finishes off every defender left strictly under `threshold` of its health
export class ExecutionDto {
  @IsNumber()
  threshold: number;
}

// An alteration an attack leaves on each defender it hit: no targeting of its own
export class HitAlterationDto {
  @IsEnum(BuffType)
  type: BuffType;

  @IsNumber()
  rate: number;

  @IsNumber()
  duration: number;

  @IsIn(['buff', 'debuff'])
  polarity: 'buff' | 'debuff';

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  terminationEvent?: string;
}

// The share of a stat a living ally of the bearer is worth, up to maxRate
class PerLivingAllyDto {
  @IsNumber()
  @IsPositive()
  maxRate: number;
}

class BattlefieldAlterationDto {
  @IsEnum(BuffType)
  type: BuffType;

  @IsNumber()
  @IsPositive()
  rate: number;

  @IsIn(['buff', 'debuff'])
  polarity: 'buff' | 'debuff';

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => PerLivingAllyDto)
  perLivingAlly?: PerLivingAllyDto;
}

class DamageSharingDto {
  @IsNumber()
  @IsPositive()
  @Max(1)
  rate: number;

  @IsNumber()
  @IsPositive()
  @Max(1)
  maxShareRate: number;
}

// Decoys shared by the allies: each takes an attack aimed at one of them on `chance`
class DecoysDto {
  @IsInt()
  @Min(1)
  count: number;

  @IsNumber()
  @IsPositive()
  @Max(1)
  chance: number;
}

class BattlefieldAlliesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => BattlefieldAlterationDto)
  alterations?: BattlefieldAlterationDto[];

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1)
  healRate?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => DamageSharingDto)
  damageSharing?: DamageSharingDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => DecoysDto)
  decoys?: DecoysDto;
}

class BattlefieldDamageDto {
  @IsNumber()
  @IsPositive()
  rate: number;

  @IsEnum(DamageType)
  damageType: DamageType;
}

class BattlefieldEnemiesDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => BattlefieldAlterationDto)
  alterations?: BattlefieldAlterationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldDamageDto)
  damage?: BattlefieldDamageDto;

  // Extra energy each enemy special costs while it stands in it
  @IsOptional()
  @IsInt()
  @Min(1)
  energySurcharge?: number;
}

class RevivalDto {
  @IsNumber()
  @IsPositive()
  @Max(1)
  rate: number;

  @IsInt()
  @Min(1)
  withinTurns: number;
}

class EmpowermentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  rate: number;
}

class BattlefieldLegacyDto {
  @IsInt()
  @Min(1)
  duration: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EmpowermentDto)
  empowerment?: EmpowermentDto;
}

// A change of the battlefield: an aura on the caster side, a hazard on the other
export class BattlefieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  duration: number;

  // The element of the battlefield, read by `battlefieldBonus`
  @IsOptional()
  @IsEnum(ElementDto)
  element?: ElementDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldAlliesDto)
  allies?: BattlefieldAlliesDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldEnemiesDto)
  enemies?: BattlefieldEnemiesDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => RevivalDto)
  revival?: RevivalDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldLegacyDto)
  legacy?: BattlefieldLegacyDto;
}

class SupportShieldDto {
  @IsNumber()
  @IsPositive()
  rate: number;

  @IsInt()
  @Min(0)
  duration: number;
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

export class EnergyRefundDto {
  @IsInt()
  @Min(1)
  amount: number;

  @IsNumber()
  @Min(0)
  minAccuracyMargin: number;
}

class LowHealthDebuffEntryDto {
  @IsEnum(BuffType)
  type: BuffType;

  @IsNumber()
  @IsPositive()
  rate: number;

  @IsInt()
  @Min(1)
  duration: number;
}

export class LowHealthDebuffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsPositive()
  @Max(1)
  threshold: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => LowHealthDebuffEntryDto)
  debuffs: LowHealthDebuffEntryDto[];
}

export class SplashDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages: DamageCompositionDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  effects?: EffectDto[];
}

export class BleedDetonationDto {
  @IsNumber()
  @IsPositive()
  ratePerStack: number;
}

export class DamageTypeBonusDto {
  @IsEnum(DamageType)
  damageType: DamageType;

  @IsNumber()
  @IsPositive()
  multiplier: number;
}

// Boosts every damage type, or only `damageType`, against a frozen defender
export class FrozenTargetBonusDto {
  @IsOptional()
  @IsEnum(DamageType)
  damageType?: DamageType;

  @IsNumber()
  @IsPositive()
  multiplier: number;
}

// Boosts every damage type, or only `damageType`, while a battlefield of that element runs
export class BattlefieldBonusDto extends FrozenTargetBonusDto {
  @IsEnum(ElementDto)
  element: ElementDto;
}

export class BleedStackBonusDto extends DamageTypeBonusDto {
  @IsInt()
  @Min(1)
  minStacks: number;
}

class AttackBonusesDto {
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BleedStackBonusDto)
  bleedStackBonus?: BleedStackBonusDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => DamageTypeBonusDto)
  concealedBonus?: DamageTypeBonusDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => FrozenTargetBonusDto)
  frozenTargetBonus?: FrozenTargetBonusDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldBonusDto)
  battlefieldBonus?: BattlefieldBonusDto;
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

  // Lets the bearer target concealed enemies while the stance runs
  @IsOptional()
  @IsBoolean()
  revealsConcealed?: boolean;

  // Chance an attack aimed at the bearer misses outright, before the dodge roll
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  evasionChance?: number;
}

// Raises every stacked poison to `stacks` at least and multiplies its damage
export class PoisonSurgeDto {
  @IsInt()
  @Min(1)
  stacks: number;

  @IsNumber()
  @IsPositive()
  damageMultiplier: number;
}

// A per-event chance that grows each time it does not fire, back to 0 once it does
export class RampingChanceDto {
  @IsNumber()
  @Min(0)
  @Max(1)
  startChance: number;

  @IsNumber()
  @Min(0)
  increment: number;

  @IsInt()
  @Min(1)
  fromTurn: number;
}

class SpecialConcealmentDto {
  @IsInt()
  @Min(0)
  duration: number;
}

export class SpecialDto extends AttackBonusesDto {
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

  @IsOptional()
  @IsInt()
  @Min(1)
  hits?: number;

  @ValidateIf((o) => o.kind !== SpecialKind.STANCE)
  @IsEnum(TargetingStrategy)
  @IsNotIn([TargetingStrategy.TARGETED_CARD], {
    message:
      'targeted-card strategy can only be used with targeting override skills',
  })
  targetingStrategy?: TargetingStrategy;

  // Required by the random-enemies targeting: how many enemies it draws
  @ValidateIf((o) => o.targetingStrategy === TargetingStrategy.RANDOM_ENEMIES)
  @IsDefined()
  @IsInt()
  @Min(1)
  targetCount?: number;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectDto)
  effect?: EffectDto;

  // ATTACK only: more effects tried on every landed hit, after `effect`
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => EffectDto)
  effects?: EffectDto[];

  // STANCE only: conceals the caster for that many turns
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SpecialConcealmentDto)
  concealment?: SpecialConcealmentDto;

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
  @ValidateIf((o) => o.kind === SpecialKind.STANCE || o.stanceActivation)
  @IsDefined()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => StanceActivationDto)
  stanceActivation?: StanceActivationDto;

  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EnergyRefundDto)
  energyRefund?: EnergyRefundDto;

  // ATTACK only: finishes off the defenders the special left under a health ratio
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => ExecutionDto)
  execution?: ExecutionDto;

  // ATTACK only: share of the defender defense the special ignores
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defensePenetration?: number;

  // ATTACK only: no dodge roll, no evasion
  @IsOptional()
  @IsBoolean()
  undodgeable?: boolean;

  // STANCE only: lays a battlefield for both sides
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldDto)
  battlefield?: BattlefieldDto;

  // ATTACK only: battlefield laid on the defenders standing next to each other
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldDto)
  adjacentTargetsBattlefield?: BattlefieldDto;
}

class DamageCompositionDto {
  @IsEnum(DamageType)
  type: DamageType;

  @IsNumber()
  @Min(0)
  rate: number;
}

class SimpleAttackDto extends AttackBonusesDto {
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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => HitAlterationDto)
  hitAlterations?: HitAlterationDto[];
}

class MultipleAttackDto extends AttackBonusesDto {
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
      o.kind === SkillKind.DAMAGE_REDUCTION ||
      o.kind === SkillKind.BLEED_STACK_SCALING ||
      o.kind === SkillKind.BLEED_EMPOWERMENT ||
      o.kind === SkillKind.BLEED_DETONATION ||
      o.kind === SkillKind.LOW_HEALTH_TARGET_BONUS ||
      o.kind === SkillKind.POISONED_ENEMY_AGILITY ||
      o.kind === SkillKind.REAL_DAMAGE ||
      o.kind === SkillKind.WEAK_POINT_LEGACY,
  )
  @IsDefined()
  @IsNumber()
  rate?: number;

  // BLEED_EMPOWERMENT: stacks each bleed of the owner lays on top of its own
  @IsOptional()
  @IsInt()
  @Min(0)
  extraStacks?: number;

  // BLEED_EMPOWERMENT: replaces the basis of the bleeds laid during the stance;
  // REAL_DAMAGE: what the rate is a share of (default source-attack)
  @IsOptional()
  @IsEnum(RateBasisDto)
  basis?: RateBasisDto;

  // BLEED_EMPOWERMENT: replaces the debuff rolled when a bleed lands during the stance
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => EffectTriggeredDebuffDto)
  triggeredDebuff?: EffectTriggeredDebuffDto;

  // BLEED_STACK_SCALING and POISONED_ENEMY_AGILITY: cap of the bonus, `rate` being its step
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.BLEED_STACK_SCALING ||
      o.kind === SkillKind.POISONED_ENEMY_AGILITY,
  )
  @IsDefined()
  @IsNumber()
  @IsPositive()
  maxRate?: number;

  @ValidateIf(
    (o) =>
      o.kind !== SkillKind.SURVIVE &&
      o.kind !== SkillKind.TRANSFORMATION &&
      o.kind !== SkillKind.DAMAGE_REDUCTION &&
      o.kind !== SkillKind.DODGE_BONUS_DENIAL &&
      o.kind !== SkillKind.BLEED_STACK_SCALING &&
      o.kind !== SkillKind.BLEED_EMPOWERMENT &&
      o.kind !== SkillKind.STANCE &&
      o.kind !== SkillKind.BLEED_DETONATION &&
      o.kind !== SkillKind.CONCEALMENT &&
      o.kind !== SkillKind.LOW_HEALTH_TARGET_BONUS &&
      o.kind !== SkillKind.POISONED_ENEMY_AGILITY &&
      o.kind !== SkillKind.ATTACKER_INSIGHT &&
      o.kind !== SkillKind.SPECIAL_ECHO &&
      o.kind !== SkillKind.ANALYSIS &&
      o.kind !== SkillKind.AFTERSHOCK &&
      o.kind !== SkillKind.WEAK_POINT_LEGACY &&
      o.kind !== SkillKind.ENERGY_GAIN,
  )
  @IsDefined()
  @IsEnum(TargetingStrategy)
  targetingStrategy: TargetingStrategy;

  // bleed-stacks-applied: bleed stacks the owner must have laid before it fires;
  // first-bleeding-enemy: bleed stacks the target must carry
  @ValidateIf(
    (o) =>
      o.event === TriggerEvent.BLEED_STACKS_APPLIED ||
      o.targetingStrategy === TargetingStrategy.FIRST_BLEEDING_ENEMY,
  )
  @IsDefined()
  @IsInt()
  @Min(1)
  stackThreshold?: number;

  // STANCE: the stance opened on the skill owner when its event fires;
  // CONDITIONAL_ATTACK: the stance it opens on its owner when it strikes
  @ValidateIf(
    (o) => o.kind === SkillKind.STANCE || o.stanceActivation !== undefined,
  )
  @IsDefined()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => StanceActivationDto)
  stanceActivation?: StanceActivationDto;

  // STANCE only: the stance opens on that chance, never while it runs
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => RampingChanceDto)
  rampingChance?: RampingChanceDto;

  @ValidateIf(
    (o) =>
      o.kind !== SkillKind.SHIELD &&
      o.kind !== SkillKind.SURVIVE &&
      o.kind !== SkillKind.TRANSFORMATION &&
      o.kind !== SkillKind.DAMAGE_REDUCTION &&
      o.kind !== SkillKind.DODGE_BONUS_DENIAL &&
      o.kind !== SkillKind.BLEED_STACK_SCALING &&
      o.kind !== SkillKind.BLEED_EMPOWERMENT &&
      o.kind !== SkillKind.LOW_HEALTH_TARGET_BONUS &&
      o.kind !== SkillKind.POISONED_ENEMY_AGILITY &&
      o.kind !== SkillKind.ATTACKER_INSIGHT,
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

  // Only active while its owner holds the named stance; required by BLEED_EMPOWERMENT
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.BLEED_EMPOWERMENT || o.requiresStance !== undefined,
  )
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  requiresStance?: string;

  // ALTERATION stack budget (buff or debuff): stackId and its cap together, or neither
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  stackId?: string;

  // ANALYSIS (required): charges laid on each enemy before the effect lands
  @ValidateIf((o) => o.kind === SkillKind.ANALYSIS || o.maxStacks !== undefined)
  @IsDefined()
  @IsNumber()
  @Min(1)
  maxStacks?: number;

  // Former name of maxStacks, still accepted so existing decks keep working
  @IsOptional()
  @IsNumber()
  @Min(1)
  debuffMaxStacks?: number;

  // Required for ALTERATION and BUFF_TRANSFER kinds
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.ALTERATION || o.kind === SkillKind.BUFF_TRANSFER,
  )
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

  // TRANSFORMATION: stances opened on the owner, each for its own duration
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => StanceActivationDto)
  stanceActivations?: StanceActivationDto[];

  // TRANSFORMATION: what its critical hits deal is multiplied by 1 + rate
  @IsOptional()
  @IsNumber()
  @IsPositive()
  criticalDamageRate?: number;

  // TRANSFORMATION: a battlefield laid for both sides when it starts
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BattlefieldDto)
  battlefield?: BattlefieldDto;

  // TRANSFORMATION: health ratio its any-ally-health-below activationEvent reads
  @ValidateIf((o) => o.activationEvent === TriggerEvent.ANY_ALLY_HEALTH_BELOW)
  @IsDefined()
  @IsNumber()
  @IsPositive()
  @Max(1)
  activationEventThreshold?: number;

  // ALTERATION: the rate is earned per living ally of the bearer, up to maxRate
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => PerLivingAllyDto)
  perLivingAlly?: PerLivingAllyDto;

  // ALTERATION: the alteration only counts while its bearer health ratio is under it
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1)
  whileHealthBelow?: number;

  // ATTACKER_INSIGHT (required): shares of base accuracy and agility gained against an enemy that already attacked
  @ValidateIf((o) => o.kind === SkillKind.ATTACKER_INSIGHT)
  @IsDefined()
  @IsNumber()
  @Min(0)
  accuracyRate?: number;

  @ValidateIf((o) => o.kind === SkillKind.ATTACKER_INSIGHT)
  @IsDefined()
  @IsNumber()
  @Min(0)
  agilityRate?: number;

  // ALTERATION: `terminationEvent` only ends it on a hit costing more than this share of max health
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(1)
  terminationDamageRate?: number;

  // ENERGY_GAIN (required): special energy its owner gains when its event fires
  @ValidateIf((o) => o.kind === SkillKind.ENERGY_GAIN)
  @IsDefined()
  @IsInt()
  @Min(1)
  amount?: number;

  // SUPPORT: shield of rate x the caster max health on each target
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SupportShieldDto)
  shield?: SupportShieldDto;

  // SUPPORT: statuses removed from each target, picked at random
  @IsOptional()
  @IsInt()
  @Min(1)
  cleanse?: number;

  // SUPPORT: alterations left on each target
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => HitAlterationDto)
  alterations?: HitAlterationDto[];

  // TRANSFORMATION: raises every stacked poison on the board and multiplies its damage
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => PoisonSurgeDto)
  poisonSurge?: PoisonSurgeDto;

  // Required for CONDITIONAL_ATTACK kind, unless a bleed detonation replaces it, and AFTERSHOCK
  @ValidateIf(
    (o) =>
      (o.kind === SkillKind.CONDITIONAL_ATTACK && !o.bleedDetonation) ||
      o.kind === SkillKind.AFTERSHOCK,
  )
  @IsDefined()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => DamageCompositionDto)
  damages?: DamageCompositionDto[];

  @ValidateIf(
    (o) =>
      (o.kind === SkillKind.CONDITIONAL_ATTACK &&
        o.event !== TriggerEvent.ALLY_HEALTH_BELOW &&
        o.event !== TriggerEvent.DAMAGE_TAKEN &&
        o.event !== TriggerEvent.DODGE &&
        o.event !== TriggerEvent.TURN_START) ||
      o.interval !== undefined,
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

  // CONDITIONAL_ATTACK and AFTERSHOCK: effect of the hit (null or absent: none);
  // AFFLICTION (required): effect laid on its targets; ANALYSIS (required): effect laid on a full enemy
  @ValidateIf(
    (o) =>
      o.kind === SkillKind.AFFLICTION ||
      o.kind === SkillKind.ANALYSIS ||
      (o.effect !== undefined && o.effect !== null),
  )
  @IsDefined()
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

  // CONDITIONAL_ATTACK: share of the defender defense the attack ignores
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  defensePenetration?: number;

  // CONDITIONAL_ATTACK: share of defense ignored instead against a defender carrying a weak point
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weakPointPenetration?: number;

  // CONDITIONAL_ATTACK: energy the attack spends, only when it strikes someone
  @IsOptional()
  @IsInt()
  @Min(1)
  energyCost?: number;

  // CONDITIONAL_ATTACK: closes its requiresStance once it struck, so it fires once per stance
  @IsOptional()
  @IsBoolean()
  endsStance?: boolean;

  // CONDITIONAL_ATTACK and CONCEALMENT: never fires when its owner lost health since its previous action
  @IsOptional()
  @IsBoolean()
  requiresUndamaged?: boolean;

  // CONDITIONAL_ATTACK: alterations left on every defender the main attack hit
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(/* istanbul ignore next */ () => HitAlterationDto)
  hitAlterations?: HitAlterationDto[];

  // CONDITIONAL_ATTACK: finishes off the defenders the main attack left under a health ratio
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => ExecutionDto)
  execution?: ExecutionDto;

  // CONDITIONAL_ATTACK: consumes the target bleed stacks, ratePerStack each
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => BleedDetonationDto)
  bleedDetonation?: BleedDetonationDto;

  // CONDITIONAL_ATTACK: secondary strike on the primary target and its neighbors
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => SplashDto)
  splash?: SplashDto;

  // CONDITIONAL_ATTACK: debuffs the primary target left under a health ratio
  @IsOptional()
  @ValidateNested()
  @Type(/* istanbul ignore next */ () => LowHealthDebuffDto)
  onLowHealthAfterHit?: LowHealthDebuffDto;

  // Required when event is ally-death, enemy-death, ally-health-below or
  // damage-taken
  @ValidateIf(
    (o) =>
      o.event === TriggerEvent.ALLY_DEATH ||
      o.event === TriggerEvent.ENEMY_DEATH ||
      o.event === TriggerEvent.ALLY_HEALTH_BELOW ||
      o.event === TriggerEvent.DAMAGE_TAKEN ||
      o.event === TriggerEvent.DODGE,
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

  // HEALING only: what the rate is a share of. Defaults to source-attack.
  @IsOptional()
  @IsEnum(RateBasisDto)
  healBasis?: RateBasisDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  powerId?: string;

  // DORMANT: event waking the skill; TRANSFORMATION: event setting it off besides its threshold
  @ValidateIf(
    (o) => o.event === TriggerEvent.DORMANT || o.activationEvent !== undefined,
  )
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
