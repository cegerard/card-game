import { BadRequestException } from '@nestjs/common';
import { OtherSkillDto, SkillKind } from './dto/fight-data.dto';
import { MathRandomizer } from '../tools/math-randomizer';
import { SurviveSkill } from '../core/cards/skills/survive';
import { DamageReductionSkill } from '../core/cards/skills/damage-reduction';
import { DodgeBonusDenialSkill } from '../core/cards/skills/dodge-bonus-denial';
import { BleedStackScalingSkill } from '../core/cards/skills/bleed-stack-scaling';
import { LowHealthTargetBonusSkill } from '../core/cards/skills/low-health-target-bonus';
import { BleedEmpowermentSkill } from '../core/cards/skills/bleed-empowerment';
import { PoisonedEnemyAgilitySkill } from '../core/cards/skills/poisoned-enemy-agility';
import { buildTriggeredDebuff } from './attack-effect-factory';

function findSkill(
  others: OtherSkillDto[],
  kind: SkillKind,
): OtherSkillDto | undefined {
  return others.find((s) => s.kind === kind);
}

export function buildSurviveSkill(
  others: OtherSkillDto[],
): SurviveSkill | undefined {
  const dto = findSkill(others, SkillKind.SURVIVE);
  return dto ? new SurviveSkill(dto.name) : undefined;
}

export function buildDodgeBonusDenialSkill(
  others: OtherSkillDto[],
): DodgeBonusDenialSkill | undefined {
  const dto = findSkill(others, SkillKind.DODGE_BONUS_DENIAL);
  return dto ? new DodgeBonusDenialSkill(dto.name) : undefined;
}

export function buildBleedStackScalingSkill(
  others: OtherSkillDto[],
): BleedStackScalingSkill | undefined {
  const dto = findSkill(others, SkillKind.BLEED_STACK_SCALING);
  return dto
    ? new BleedStackScalingSkill(dto.name, dto.rate, dto.maxRate)
    : undefined;
}

/**
 * The domain rejects an out-of-range rate. That is a malformed request, not
 * a server fault, so it surfaces as a 400 like the composite power check.
 */
export function buildDamageReduction(
  others: OtherSkillDto[],
): DamageReductionSkill | undefined {
  const dto = findSkill(others, SkillKind.DAMAGE_REDUCTION);
  if (!dto) return undefined;

  try {
    return new DamageReductionSkill(
      dto.name,
      dto.rate,
      new MathRandomizer(),
      dto.probability,
    );
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}

export function buildBleedEmpowerment(
  others: OtherSkillDto[],
): BleedEmpowermentSkill | undefined {
  const dto = findSkill(others, SkillKind.BLEED_EMPOWERMENT);
  if (!dto) return undefined;

  const triggeredDebuff = buildTriggeredDebuff(dto.triggeredDebuff);
  try {
    return new BleedEmpowermentSkill(
      dto.name,
      dto.requiresStance,
      dto.extraStacks,
      dto.rate,
      { duration: dto.duration, basis: dto.basis, triggeredDebuff },
    );
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}

export function buildLowHealthTargetBonus(
  others: OtherSkillDto[],
): LowHealthTargetBonusSkill | undefined {
  const dto = findSkill(others, SkillKind.LOW_HEALTH_TARGET_BONUS);
  if (!dto) return undefined;
  if (dto.activationCondition?.threshold === undefined) {
    throw new BadRequestException(
      `${dto.kind} requires activationCondition.threshold`,
    );
  }
  try {
    return new LowHealthTargetBonusSkill(
      dto.name,
      dto.rate,
      dto.activationCondition.threshold,
    );
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}

export function buildPoisonedEnemyAgility(
  others: OtherSkillDto[],
): PoisonedEnemyAgilitySkill | undefined {
  const dto = findSkill(others, SkillKind.POISONED_ENEMY_AGILITY);
  if (!dto) return undefined;

  try {
    return new PoisonedEnemyAgilitySkill(dto.name, dto.rate, dto.maxRate);
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}
