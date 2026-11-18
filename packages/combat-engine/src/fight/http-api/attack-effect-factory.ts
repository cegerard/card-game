import { BadRequestException } from '@nestjs/common';
import { EffectType } from '@card-game/shared-types';
import {
  CONTROL_EFFECTS,
  EffectDto,
  EffectTriggeredDebuffDto,
} from './dto/fight-data.dto';
import { PoisonAttackEffect } from '../core/cards/@types/attack/attack-poison-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnAttackEffect } from '../core/cards/@types/attack/attack-burn-effect';
import { FreezeAttackEffect } from '../core/cards/@types/attack/attack-freeze-effect';
import { StuntAttackEffect } from '../core/cards/@types/attack/attack-stunt-effect';
import { MarkAttackEffect } from '../core/cards/@types/attack/attack-mark-effect';
import { BleedAttackEffect } from '../core/cards/@types/attack/attack-bleed-effect';
import { ElementalMark } from '../core/cards/@types/mark/elemental-mark';
import { EffectTriggeredDebuff } from '../core/cards/@types/attack/effect-triggered-debuff';
import { Randomizer } from '../core/randomizer';
import { StackedPoisonAttackEffect } from '../core/cards/@types/attack/attack-stacked-poison-effect';
import { WeakPointAttackEffect } from '../core/cards/@types/attack/attack-weak-point-effect';
import { HypothermiaAttackEffect } from '../core/cards/@types/attack/attack-hypothermia-effect';
import { EntangleAttackEffect } from '../core/cards/@types/attack/attack-entangle-effect';
import { EnergyDrainAttackEffect } from '../core/cards/@types/attack/attack-energy-drain-effect';
import { VulnerabilityAttackEffect } from '../core/cards/@types/attack/attack-vulnerability-effect';
import { SupportBlockAttackEffect } from '../core/cards/@types/attack/attack-support-block-effect';
import {
  asBadRequest,
  buildAlterationStacking,
  requireBuffType,
} from './skill-wiring-factory';

export function buildEffects(
  effectDtos: EffectDto[] | undefined,
  randomizer: Randomizer,
): AttackEffect[] | undefined {
  if (!effectDtos?.length) return undefined;
  return effectDtos.map((dto) => buildEffect(dto, randomizer));
}

const STACKED_POISON_ONLY_FIELDS = [
  'stackMultiplier',
  'ignoresImmunity',
] as const;
const STACK_CAPPED_EFFECTS: readonly EffectType[] = [
  EffectType.MARK,
  EffectType.BLEED,
  EffectType.POISON,
];

/**
 * A field the effect would silently ignore is a malformed request: stack caps
 * belong to MARK, BLEED and the stacked POISON, and a stacked poison counts
 * stacks, not levels.
 */
function rejectMisplacedFields(effectDto: EffectDto): void {
  const stackedPoison =
    effectDto.type === EffectType.POISON && effectDto.maxStacks !== undefined;
  const misplaced: string[] = [
    ...(stackedPoison
      ? []
      : STACKED_POISON_ONLY_FIELDS.filter(
          (field) => effectDto[field] !== undefined,
        )),
    ...(effectDto.maxStacks !== undefined &&
    !STACK_CAPPED_EFFECTS.includes(effectDto.type)
      ? ['maxStacks']
      : []),
    ...(stackedPoison && effectDto.level !== undefined ? ['level'] : []),
    ...(effectDto.type !== EffectType.WEAK_POINT &&
    effectDto.weakPoint !== undefined
      ? ['weakPoint']
      : []),
    // A weak point carries its duration itself
    ...(effectDto.type === EffectType.WEAK_POINT &&
    effectDto.duration !== undefined
      ? ['duration']
      : []),
    ...(CONTROL_EFFECTS.includes(effectDto.type) &&
    effectDto.triggeredDebuff !== undefined
      ? ['triggeredDebuff']
      : []),
  ];
  if (misplaced.length > 0) {
    throw new BadRequestException(
      `${effectDto.type} effect cannot carry: ${misplaced.join(', ')}`,
    );
  }
}

export function buildEffect(
  effectDto: EffectDto,
  randomizer: Randomizer,
): AttackEffect {
  rejectMisplacedFields(effectDto);
  const triggeredDebuff = buildTriggeredDebuff(
    effectDto.triggeredDebuff,
    randomizer,
  );

  switch (effectDto.type) {
    case EffectType.POISON:
      if (effectDto.maxStacks !== undefined) {
        return buildStackedPoison(effectDto, triggeredDebuff, randomizer);
      }
      return new PoisonAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        randomizer,
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.probability,
      );
    case EffectType.BURN:
      return asBadRequest(
        () =>
          new BurnAttackEffect(
            effectDto.rate,
            effectDto.level as EffectLevel,
            randomizer,
            triggeredDebuff,
            effectDto.terminationEvent,
            effectDto.probability,
            effectDto.duration,
          ),
      );
    case EffectType.FREEZE:
      return asBadRequest(
        () =>
          new FreezeAttackEffect(
            effectDto.rate,
            effectDto.level as EffectLevel,
            randomizer,
            triggeredDebuff,
            effectDto.terminationEvent,
            effectDto.probability,
            effectDto.duration,
          ),
      );
    case EffectType.STUNT:
      return new StuntAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        randomizer,
        effectDto.probability,
        effectDto.terminationEvent,
      );
    case EffectType.MARK:
      return new MarkAttackEffect(
        new ElementalMark(
          effectDto.damageType,
          effectDto.rate,
          effectDto.maxStacks,
        ),
        randomizer,
        effectDto.stacks,
        effectDto.probability,
        triggeredDebuff,
      );
    case EffectType.BLEED:
      return new BleedAttackEffect(
        effectDto.rate,
        effectDto.duration,
        effectDto.maxStacks,
        randomizer,
        effectDto.stacks,
        effectDto.probability,
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.basis,
      );
    case EffectType.WEAK_POINT:
      return buildWeakPoint(effectDto, randomizer);
    case EffectType.HYPOTHERMIA:
      return asBadRequest(
        () =>
          new HypothermiaAttackEffect(
            effectDto.rate,
            effectDto.duration,
            randomizer,
            effectDto.probability,
            effectDto.terminationEvent,
          ),
      );
    case EffectType.ENTANGLE:
      return asBadRequest(
        () =>
          new EntangleAttackEffect(
            effectDto.rate,
            randomizer,
            effectDto.probability,
            effectDto.terminationEvent,
          ),
      );
    case EffectType.ENERGY_DRAIN:
      return asBadRequest(
        () =>
          new EnergyDrainAttackEffect(
            effectDto.rate,
            randomizer,
            effectDto.probability,
          ),
      );
    case EffectType.SUPPORT_BLOCK:
      return asBadRequest(
        () =>
          new SupportBlockAttackEffect(
            effectDto.duration,
            randomizer,
            effectDto.probability,
          ),
      );
    case EffectType.VULNERABILITY:
      return asBadRequest(
        () =>
          new VulnerabilityAttackEffect(
            effectDto.damageType,
            effectDto.rate,
            effectDto.duration,
            randomizer,
            effectDto.probability,
          ),
      );
  }
}

function buildWeakPoint(
  effectDto: EffectDto,
  randomizer: Randomizer,
): WeakPointAttackEffect {
  const dto = effectDto.weakPoint;

  return asBadRequest(
    () =>
      new WeakPointAttackEffect(
        {
          name: dto.name,
          duration: dto.duration,
          damageMultiplier: dto.damageMultiplier,
          criticalChanceBonus: dto.criticalChanceBonus,
          consumable: dto.consumable,
          revealerBonus: {
            accuracyRate: dto.revealerAccuracyRate,
            attackRate: dto.revealerAttackRate,
            damageRate: dto.revealerDamageRate,
          },
          exploitEffect:
            dto.exploitEffect && buildEffect(dto.exploitEffect, randomizer),
        },
        randomizer,
        effectDto.probability,
      ),
  );
}

function buildStackedPoison(
  effectDto: EffectDto,
  triggeredDebuff: EffectTriggeredDebuff | undefined,
  randomizer: Randomizer,
): StackedPoisonAttackEffect {
  return asBadRequest(
    () =>
      new StackedPoisonAttackEffect(
        effectDto.rate,
        effectDto.duration,
        effectDto.maxStacks,
        effectDto.stackMultiplier,
        randomizer,
        {
          stacks: effectDto.stacks,
          basis: effectDto.basis,
          probability: effectDto.probability,
          triggeredDebuff,
          terminationEvent: effectDto.terminationEvent,
          ignoresImmunity: effectDto.ignoresImmunity,
        },
      ),
  );
}

export function buildTriggeredDebuff(
  dto: EffectTriggeredDebuffDto | undefined,
  randomizer: Randomizer,
): EffectTriggeredDebuff | undefined {
  if (!dto) return undefined;

  return new EffectTriggeredDebuff(
    dto.probability,
    requireBuffType(dto.debuffType),
    dto.debuffRate,
    dto.duration,
    randomizer,
    dto.terminationEvent,
    dto.powerId,
    buildAlterationStacking(dto.stackId, dto.maxStacks, ` triggeredDebuff`),
  );
}
