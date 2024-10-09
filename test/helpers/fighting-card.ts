import { faker } from '@faker-js/faker';

import { FightingCard } from '../../src/core/cards/fighting-card';
import { SimpleAttack } from '../../src/core/cards/skills/simple-attack';
import { SpecialAttack } from '../../src/core/cards/skills/special-attack';
import { TargetedFromPosition } from '../../src/core/targeting-card-strategies/targeted-from-position';
import { TargetingCardStrategy } from '../../src/core/targeting-card-strategies/targeting-card-strategy';
import { TargetedAll } from 'src/core/targeting-card-strategies/targeted-all';

type FightingCardParams = {
  name?: string;
  damage?: number;
  defense?: number;
  health?: number;
  speed?: number;
  criticalChance?: number;
  skills?: {
    simpleAttack?: {
      name?: string;
      damageRate?: number;
      targetingStrategy?: string;
    };
    specialAttack?: {
      name?: string;
      damageRate?: number;
      energy?: number;
      targetingStrategy?: string;
    };
  };
};

function createTargetingStrategy(strategy: string): TargetingCardStrategy {
  switch (strategy) {
    case 'position-based':
      return new TargetedFromPosition();
    case 'target-all':
      return new TargetedAll();
    default:
      throw new Error(`Unknown targeting strategy: ${strategy}`);
  }
}

function createSimpleAttack(params: {
  damageRate?: number;
  targetingStrategy?: string;
}): SimpleAttack {
  const damageRate =
    params.damageRate || faker.number.float({ min: 1.0, max: 3.0 });
  const targetingStrategy = params.targetingStrategy || 'position-based';

  return new SimpleAttack(
    damageRate,
    createTargetingStrategy(targetingStrategy),
  );
}

function createSpecialAttack(params: {
  damageRate?: number;
  energy?: number;
  targetingStrategy?: string;
}): SpecialAttack {
  const damageRate =
    params.damageRate || faker.number.int({ min: 2.5, max: 8.0 });
  const energy = params.energy || faker.number.int({ min: 30, max: 100 });
  const targetingStrategy = params.targetingStrategy || 'position-based';

  return new SpecialAttack(
    damageRate,
    energy,
    createTargetingStrategy(targetingStrategy),
  );
}

export function createFightingCard(params: FightingCardParams): FightingCard {
  const cardName = params.name || faker.animal.type();
  const damage = params.damage || faker.number.int({ min: 100, max: 800 });
  const defense = params.defense || faker.number.int({ min: 100, max: 500 });
  const health = params.health || faker.number.int({ min: 2000, max: 10000 });
  const speed = params.speed || faker.number.int({ min: 100, max: 500 });
  const criticalChance =
    params.criticalChance || faker.number.float({ max: 0.9 });

  return new FightingCard(
    cardName,
    {
      damage,
      defense,
      health,
      speed,
      criticalChance,
    },
    {
      simpleAttack: createSimpleAttack(params.skills?.simpleAttack || {}),
      specialAttack: createSpecialAttack(params.skills?.specialAttack || {}),
    },
  );
}
