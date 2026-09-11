import { faker } from '@faker-js/faker';

import { PoisonAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-poison-effect';
import { BurnAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-burn-effect';
import { AttackEffect } from '../../src/fight/core/cards/@types/attack/attack-effect';
import { EffectLevel } from '../../src/fight/core/cards/@types/attack/effect-level';
import { FreezeAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-freeze-effect';
import { StuntAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-stunt-effect';
import { MathRandomizer } from '../../src/fight/tools/math-randomizer';
import { MarkAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-mark-effect';
import { ElementalMark } from '../../src/fight/core/cards/@types/mark/elemental-mark';
import { DamageType } from '../../src/fight/core/cards/@types/damage/damage-type';

export function createEffect(params: {
  rate?: number;
  level?: EffectLevel;
  type: string;
  terminationEvent?: string;
  damageType?: DamageType;
  maxStacks?: number;
  stacks?: number;
  probability?: number;
}): AttackEffect {
  const effectRate = params.rate ?? faker.number.float({ min: 0.1, max: 0.5 });
  const effectLevel =
    params.level ?? (faker.number.int({ min: 1, max: 3 }) as EffectLevel);

  switch (params.type) {
    case 'poison':
      return new PoisonAttackEffect(
        effectRate,
        effectLevel,
        new MathRandomizer(),
        undefined,
        params.terminationEvent,
      );
    case 'burn':
      return new BurnAttackEffect(
        effectRate,
        effectLevel,
        new MathRandomizer(),
        undefined,
        params.terminationEvent,
      );
    case 'freeze':
      return new FreezeAttackEffect(
        effectRate,
        effectLevel,
        new MathRandomizer(),
        undefined,
        params.terminationEvent,
      );
    case 'stunt':
      return new StuntAttackEffect(
        effectRate,
        effectLevel,
        new MathRandomizer(),
        undefined,
        params.terminationEvent,
      );
    case 'mark':
      if (!params.damageType || !params.maxStacks) {
        throw new Error('mark effect requires a damageType and a maxStacks');
      }
      return new MarkAttackEffect(
        new ElementalMark(params.damageType, effectRate, params.maxStacks),
        new MathRandomizer(),
        params.stacks,
        params.probability,
      );
    default:
      throw new Error(`Unknown effect type: ${params.type}`);
  }
}
