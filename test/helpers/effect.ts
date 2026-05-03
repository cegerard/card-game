import { faker } from '@faker-js/faker';

import { PoisonAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-poison-effect';
import { BurnAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-burn-effect';
import { AttackEffect } from '../../src/fight/core/cards/@types/attack/attack-effect';
import { EffectLevel } from '../../src/fight/core/cards/@types/attack/effect-level';
import { FreezeAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-freeze-effect';
import { StuntAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-stunt-effect';
import { MathRandomizer } from '../../src/fight/tools/math-randomizer';

export function createEffect(params: {
  rate?: number;
  level?: EffectLevel;
  type: string;
  terminationEvent?: string;
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
    default:
      throw new Error(`Unknown effect type: ${params.type}`);
  }
}
