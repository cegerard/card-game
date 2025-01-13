import { Type } from 'class-transformer';
import {
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsString,
  IsNotEmpty,
} from 'class-validator';

class SpecialAttackDto {
  @IsString()
  name: string;

  @IsNumber()
  damageRate: number;

  @IsNumber()
  energy: number;

  @IsString()
  targetingStrategy: string;
}

class SimpleAttackDto {
  @IsString()
  name: string;

  @IsNumber()
  damageRate: number;

  @IsString()
  targetingStrategy: string;
}

class SkillsDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SpecialAttackDto)
  specialAttack: SpecialAttackDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SimpleAttackDto)
  simpleAttack: SimpleAttackDto;
}

class BehaviorsDto {
  @IsString()
  dodge: string;
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

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => SkillsDto)
  skills: SkillsDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => BehaviorsDto)
  behaviors: BehaviorsDto;
}

class PlayerDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => FightingCardDto)
  deck: FightingCardDto[];

  @IsString()
  name: string;
}

export class FightDataDto {
  @ValidateNested()
  @Type(() => PlayerDto)
  player1: PlayerDto;

  @ValidateNested()
  @Type(() => PlayerDto)
  player2: PlayerDto;

  @IsString()
  cardSelectorStrategy: string;
}
