import { BadRequestException } from '@nestjs/common';
import {
  Effect,
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
import { MathRandomizer } from '../tools/math-randomizer';
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
  mapAlterationType,
} from './skill-wiring-factory';

export function buildEffects(
  effectDtos?: EffectDto[],
): AttackEffect[] | undefined {
  if (!effectDtos?.length) return undefined;
  return effectDtos.map((dto) => buildEffect(dto));
}

const STACKED_POISON_ONLY_FIELDS = [
  'stackMultiplier',
  'ignoresImmunity',
] as const;
const STACK_CAPPED_EFFECTS = [Effect.MARK, Effect.BLEED, Effect.POISON];
const DEBUFFLESS_EFFECTS = [
  Effect.ENTANGLE,
  Effect.ENERGY_DRAIN,
  Effect.VULNERABILITY,
  Effect.SUPPORT_BLOCK,
];

/**
 * A field the effect would silently ignore is a malformed request: stack caps
 * belong to MARK, BLEED and the stacked POISON, and a stacked poison counts
 * stacks, not levels.
 */
function rejectMisplacedFields(effectDto: EffectDto): void {
  const stackedPoison =
    effectDto.type === Effect.POISON && effectDto.maxStacks !== undefined;
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
    ...(effectDto.type !== Effect.WEAK_POINT &&
    effectDto.weakPoint !== undefined
      ? ['weakPoint']
      : []),
    // A weak point carries its duration itself
    ...(effectDto.type === Effect.WEAK_POINT && effectDto.duration !== undefined
      ? ['duration']
      : []),
    ...(DEBUFFLESS_EFFECTS.includes(effectDto.type) &&
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

export function buildEffect(effectDto: EffectDto): AttackEffect {
  rejectMisplacedFields(effectDto);
  const triggeredDebuff = buildTriggeredDebuff(effectDto.triggeredDebuff);

  switch (effectDto.type) {
    case Effect.POISON:
      if (effectDto.maxStacks !== undefined) {
        return buildStackedPoison(effectDto, triggeredDebuff);
      }
      return new PoisonAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        new MathRandomizer(),
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.probability,
      );
    case Effect.BURN:
      return new BurnAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        new MathRandomizer(),
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.probability,
      );
    case Effect.FREEZE:
      return new FreezeAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        new MathRandomizer(),
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.probability,
      );
    case Effect.STUNT:
      return new StuntAttackEffect(
        effectDto.rate,
        effectDto.level as EffectLevel,
        new MathRandomizer(),
        effectDto.probability,
        effectDto.terminationEvent,
      );
    case Effect.MARK:
      return new MarkAttackEffect(
        new ElementalMark(
          effectDto.damageType,
          effectDto.rate,
          effectDto.maxStacks,
        ),
        new MathRandomizer(),
        effectDto.stacks,
        effectDto.probability,
        triggeredDebuff,
      );
    case Effect.BLEED:
      return new BleedAttackEffect(
        effectDto.rate,
        effectDto.duration,
        effectDto.maxStacks,
        new MathRandomizer(),
        effectDto.stacks,
        effectDto.probability,
        triggeredDebuff,
        effectDto.terminationEvent,
        effectDto.basis,
      );
    case Effect.WEAK_POINT:
      return buildWeakPoint(effectDto);
    case Effect.HYPOTHERMIA:
      return asBadRequest(
        () =>
          new HypothermiaAttackEffect(
            effectDto.rate,
            effectDto.duration,
            new MathRandomizer(),
            effectDto.probability,
            effectDto.terminationEvent,
          ),
      );
    case Effect.ENTANGLE:
      return asBadRequest(
        () =>
          new EntangleAttackEffect(
            effectDto.rate,
            new MathRandomizer(),
            effectDto.probability,
            effectDto.terminationEvent,
          ),
      );
    case Effect.ENERGY_DRAIN:
      return asBadRequest(
        () =>
          new EnergyDrainAttackEffect(
            effectDto.rate,
            new MathRandomizer(),
            effectDto.probability,
          ),
      );
    case Effect.SUPPORT_BLOCK:
      return asBadRequest(
        () =>
          new SupportBlockAttackEffect(
            effectDto.duration,
            new MathRandomizer(),
            effectDto.probability,
          ),
      );
    case Effect.VULNERABILITY:
      return asBadRequest(
        () =>
          new VulnerabilityAttackEffect(
            effectDto.damageType,
            effectDto.rate,
            effectDto.duration,
            new MathRandomizer(),
            effectDto.probability,
          ),
      );
  }
}

function buildWeakPoint(effectDto: EffectDto): WeakPointAttackEffect {
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
          exploitEffect: dto.exploitEffect && buildEffect(dto.exploitEffect),
        },
        new MathRandomizer(),
        effectDto.probability,
      ),
  );
}

function buildStackedPoison(
  effectDto: EffectDto,
  triggeredDebuff: EffectTriggeredDebuff | undefined,
): StackedPoisonAttackEffect {
  return asBadRequest(
    () =>
      new StackedPoisonAttackEffect(
        effectDto.rate,
        effectDto.duration,
        effectDto.maxStacks,
        effectDto.stackMultiplier,
        new MathRandomizer(),
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
): EffectTriggeredDebuff | undefined {
  if (!dto) return undefined;

  return new EffectTriggeredDebuff(
    dto.probability,
    mapAlterationType(dto.debuffType),
    dto.debuffRate,
    dto.duration,
    new MathRandomizer(),
    dto.terminationEvent,
    dto.powerId,
    buildAlterationStacking(dto.stackId, dto.maxStacks, ` triggeredDebuff`),
  );
}
