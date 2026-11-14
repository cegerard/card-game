import { BadRequestException } from '@nestjs/common';
import {
  SpecialDto,
  SpecialKind,
  TargetingStrategy,
} from './dto/fight-data.dto';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildAlterationCondition } from './alteration-condition-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { MarkedTargetBonus } from '../core/cards/@types/mark/marked-target-bonus';
import { Alteration } from '../core/cards/@types/alteration/alteration';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ShieldApplication } from '../core/cards/@types/shield/shield-application';
import { SpecialStance } from '../core/cards/skills/special-stance';
import { buildEffect } from './attack-effect-factory';
import {
  buildDamageBonuses,
  buildEnergyRefund,
  buildExecution,
} from './attack-skill-factory';
import { mapAlterationType } from './skill-wiring-factory';
import { buildBattlefield } from './battlefield-factory';

// What only a special that strikes can carry
const STANCE_SPECIAL_FORBIDDEN_FIELDS = [
  'damages',
  'rate',
  'hits',
  'targetingStrategy',
  'effect',
  'effects',
  'energyRefund',
  'markedTargetBonus',
  'bleedStackBonus',
  'concealedBonus',
  'execution',
  'defensePenetration',
  'undodgeable',
  'targetCount',
  'adjacentTargetsBattlefield',
] as const;

export function buildSpecial(dto: SpecialDto): Special {
  if (dto.concealment && dto.kind !== SpecialKind.STANCE) {
    throw new BadRequestException(
      'Only a STANCE special can conceal its caster: an attack would reveal it at once',
    );
  }
  if (dto.battlefield && dto.kind !== SpecialKind.STANCE) {
    throw new BadRequestException(
      'Only a STANCE special can lay a battlefield',
    );
  }

  if (
    dto.targetCount !== undefined &&
    dto.targetingStrategy !== TargetingStrategy.RANDOM_ENEMIES
  ) {
    throw new BadRequestException(
      'targetCount only goes with the random-enemies targeting',
    );
  }

  if (dto.kind === SpecialKind.ATTACK) {
    return buildSpecialAttack(dto);
  }
  if (dto.kind === SpecialKind.STANCE) {
    return buildSpecialStance(dto);
  }
  if (dto.kind === SpecialKind.HEALING) {
    if (dto.adjacentTargetsBattlefield) {
      throw new BadRequestException(
        'Only an ATTACK special can lay a battlefield between its targets',
      );
    }
    return new SpecialHealing(
      dto.name,
      dto.rate,
      dto.energy,
      buildTargetingStrategy(dto.targetingStrategy),
    );
  }
  throw new Error(`Unknown SpecialKind: ${dto.kind}`);
}

function buildSpecialAttack(dto: SpecialDto): SpecialAttack {
  const alterations = buildSpecialAlterations(dto);

  const rawDamages = dto.damages;
  if (!rawDamages || rawDamages.length === 0) {
    throw new Error('Special attack requires at least one damage composition');
  }
  const specialDamages = rawDamages.map(
    (d) => new DamageComposition(d.type, d.rate),
  );
  const shieldApplication = buildShieldApplication(dto);

  const markedBonusDto = dto.markedTargetBonus;
  const markedTargetBonus = markedBonusDto
    ? new MarkedTargetBonus(
        markedBonusDto.damageType,
        markedBonusDto.multiplier,
      )
    : undefined;

  return new SpecialAttack(
    dto.name,
    specialDamages,
    dto.energy,
    buildTargetingStrategy(
      dto.targetingStrategy,
      undefined,
      undefined,
      dto.targetCount,
    ),
    [dto.effect, ...(dto.effects ?? [])]
      .filter((effect) => effect != null)
      .map(buildEffect),
    alterations.length > 0 ? alterations : undefined,
    shieldApplication,
    markedTargetBonus,
    dto.stanceActivation,
    dto.hits,
    buildDamageBonuses(dto),
    buildEnergyRefund(dto.energyRefund),
    buildExecution(dto.execution),
    dto.defensePenetration,
    dto.undodgeable,
    buildBattlefield(dto.adjacentTargetsBattlefield),
  );
}

function buildSpecialStance(dto: SpecialDto): SpecialStance {
  const strikingFields = STANCE_SPECIAL_FORBIDDEN_FIELDS.filter(
    (field) => dto[field] !== undefined,
  );
  if (strikingFields.length > 0) {
    throw new BadRequestException(
      `STANCE special strikes nobody and cannot carry: ${strikingFields.join(', ')}`,
    );
  }

  return new SpecialStance(
    dto.name,
    dto.energy,
    dto.stanceActivation,
    buildSpecialAlterations(dto),
    buildShieldApplication(dto),
    dto.concealment?.duration,
    buildBattlefield(dto.battlefield),
  );
}

function buildSpecialAlterations(dto: SpecialDto): Alteration[] {
  return (dto.statAlterations ?? []).map((a) => {
    const condition = a.condition
      ? buildAlterationCondition(a.condition.type, {
          allyName: a.condition.allyName,
        })
      : undefined;
    return new Alteration(
      mapAlterationType(a.type),
      a.rate,
      a.duration,
      buildTargetingStrategy(a.targetingStrategy),
      condition,
      a.condition?.multiplier,
      a.terminationEvent,
      a.polarity,
    );
  });
}

function buildShieldApplication(
  dto: SpecialDto,
): ShieldApplication | undefined {
  const shieldDto = dto.shieldApplication;
  if (!shieldDto) return undefined;

  return new ShieldApplication(
    shieldDto.rate,
    shieldDto.duration,
    buildTargetingStrategy(shieldDto.targetingStrategy),
  );
}
