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
import {
  buildAlterationStacking,
  mapAlterationType,
} from './skill-wiring-factory';

export function buildEffects(
  effectDtos?: EffectDto[],
): AttackEffect[] | undefined {
  if (!effectDtos?.length) return undefined;
  return effectDtos.map((dto) => buildEffect(dto));
}

export function buildEffect(effectDto: EffectDto): AttackEffect {
  const triggeredDebuff = buildTriggeredDebuff(effectDto.triggeredDebuff);

  switch (effectDto.type) {
    case Effect.POISON:
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
  }
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
