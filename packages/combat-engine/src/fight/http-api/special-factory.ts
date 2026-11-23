import { Randomizer } from '../core/randomizer';
import { BadRequestException } from '@nestjs/common';
import { SpecialKind, TargetingStrategy } from '@card-game/shared-types';
import { SpecialDto } from './dto/fight-data.dto';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildAlterationCondition } from './alteration-condition-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { MarkedTargetBonus } from '../core/cards/@types/mark/marked-target-bonus';
import { Alteration } from '../core/cards/@types/alteration/alteration';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ShieldApplication } from '../core/cards/@types/shield/shield-application';
import { SpecialTargets } from '../core/targeting-card-strategies/special-targets';
import { SpecialStance } from '../core/cards/skills/special-stance';
import { buildEffect } from './attack-effect-factory';
import {
  buildDamageBonuses,
  buildEnergyRefund,
  buildExecution,
} from './attack-skill-factory';
import { requireBuffType } from './skill-wiring-factory';
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

// What a HEALING special would silently drop: it heals, then shields.
const HEALING_SPECIAL_FORBIDDEN_FIELDS = [
  'damages',
  'hits',
  'effect',
  'effects',
  'statAlterations',
  'markedTargetBonus',
  'stanceActivation',
  'energyRefund',
  'execution',
  'defensePenetration',
  'undodgeable',
  'bleedStackBonus',
  'concealedBonus',
  'frozenTargetBonus',
  'battlefieldBonus',
  'adjacentTargetsBattlefield',
] as const;

export function buildSpecial(dto: SpecialDto, randomizer: Randomizer): Special {
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

  if (dto.healBasis && dto.kind !== SpecialKind.HEALING) {
    throw new BadRequestException('Only a HEALING special takes a healBasis');
  }

  if (dto.kind === SpecialKind.ATTACK) {
    return buildSpecialAttack(dto, randomizer);
  }
  if (dto.kind === SpecialKind.STANCE) {
    return buildSpecialStance(dto, randomizer);
  }
  if (dto.kind === SpecialKind.HEALING) {
    rejectFields(
      dto,
      HEALING_SPECIAL_FORBIDDEN_FIELDS,
      'HEALING special only heals and shields, it cannot carry',
    );
    if (dto.targetingStrategy === TargetingStrategy.RANDOM_ENEMIES) {
      throw new BadRequestException(
        'A HEALING special heals allies: it cannot target random enemies',
      );
    }
    return new SpecialHealing(
      dto.name,
      dto.rate,
      dto.energy,
      buildTargetingStrategy(dto.targetingStrategy),
      dto.healBasis,
      buildShieldApplication(dto),
    );
  }
  throw new Error(`Unknown SpecialKind: ${dto.kind}`);
}

function buildSpecialAttack(
  dto: SpecialDto,
  randomizer: Randomizer,
): SpecialAttack {
  const alterations = buildSpecialAlterations(dto, randomizer);

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
      randomizer,
    ),
    [dto.effect, ...(dto.effects ?? [])]
      .filter((effect) => effect != null)
      .map((effect) => buildEffect(effect, randomizer)),
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

function buildSpecialStance(
  dto: SpecialDto,
  randomizer: Randomizer,
): SpecialStance {
  rejectFields(
    dto,
    STANCE_SPECIAL_FORBIDDEN_FIELDS,
    'STANCE special strikes nobody and cannot carry',
  );

  return new SpecialStance(
    dto.name,
    dto.energy,
    dto.stanceActivation,
    buildSpecialAlterations(dto, randomizer),
    buildShieldApplication(dto),
    dto.concealment?.duration,
    buildBattlefield(dto.battlefield),
  );
}

function buildSpecialAlterations(
  dto: SpecialDto,
  randomizer: Randomizer,
): Alteration[] {
  return (dto.statAlterations ?? []).map((a) => {
    const condition = a.condition
      ? buildAlterationCondition(
          a.condition.type,
          {
            allyName: a.condition.allyName,
          },
          randomizer,
        )
      : undefined;
    return new Alteration(
      requireBuffType(a.type),
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
    shieldDto.targetingStrategy === TargetingStrategy.SPECIAL_TARGETS &&
      dto.kind === SpecialKind.HEALING
      ? new SpecialTargets()
      : buildTargetingStrategy(shieldDto.targetingStrategy),
  );
}

/** A 400 naming the fields of `fields` the special carries, if any. */
function rejectFields(
  dto: SpecialDto,
  fields: readonly (keyof SpecialDto)[],
  reason: string,
): void {
  const carried = fields.filter((field) => dto[field] !== undefined);
  if (carried.length > 0) {
    throw new BadRequestException(`${reason}: ${carried.join(', ')}`);
  }
}
