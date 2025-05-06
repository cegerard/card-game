import { faker } from '@faker-js/faker/.';

import { PoisonedAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-poisoned-effect';
import { BurnedAttackEffect } from '../../src/fight/core/cards/@types/attack/attack-burned-effect';
import { AttackEffect } from '../../src/fight/core/cards/@types/attack/attack-effect';
import { EffectLevel } from '../../src/fight/core/cards/@types/attack/effect-level';

export function createEffect(params: {
  rate: number;
  level: EffectLevel;
  type: string;
}): AttackEffect {
  const effectRate = params.rate ?? faker.number.float({ min: 0.1, max: 0.5 });
  const effectLevel =
    params.level ?? (faker.number.int({ min: 1, max: 3 }) as EffectLevel);

  switch (params.type) {
    case 'poison':
      return new PoisonedAttackEffect(effectRate, effectLevel);
    case 'burn':
      return new BurnedAttackEffect(effectRate, effectLevel);
    default:
      throw new Error(`Unknown effect type: ${params.type}`);
  }
}
