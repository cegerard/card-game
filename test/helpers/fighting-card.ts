import { faker } from '@faker-js/faker';

import { FightingCard } from '../../src/fight/core/cards/fighting-card';
import { SimpleAttack } from '../../src/fight/core/cards/skills/simple-attack';
import { SpecialAttack } from '../../src/fight/core/cards/skills/special-attack';
import { TargetedFromPosition } from '../../src/fight/core/targeting-card-strategies/targeted-from-position';
import { TargetingCardStrategy } from '../../src/fight/core/targeting-card-strategies/targeting-card-strategy';
import { TargetedAll } from '../../src/fight/core/targeting-card-strategies/targeted-all';
import { SimpleDodge } from '../../src/fight/core/cards/behaviors/simple-dodge';
import { Special } from '../../src/fight/core/cards/skills/special';
import { SpecialHealing } from '../../src/fight/core/cards/skills/special-healing';
import { AllOwnerCards } from '../../src/fight/core/targeting-card-strategies/all-owner-cards';
import { Launcher } from '../../src/fight/core/targeting-card-strategies/launcher';
import { AllAllies } from '../../src/fight/core/targeting-card-strategies/all-allies';
import { Healing } from '../../src/fight/core/cards/skills/healing';
import { Skill } from '../../src/fight/core/cards/skills/skill';
import { TurnEnd } from '../../src/fight/core/trigger/turn-end';
import { Trigger } from '../../src/fight/core/trigger/trigger';
import { createEffect } from './effect';

type effect = {
  type: string;
  rate: number;
  level: 1 | 2 | 3;
};

type FightingCardParams = {
  name?: string;
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  criticalChance?: number;
  agility?: number;
  accuracy?: number;
  skills?: {
    simpleAttack?: {
      name?: string;
      damageRate?: number;
      targetingStrategy?: string;
      effect?: effect;
    };
    special?: {
      name?: string;
      damageRate?: number;
      energy?: number;
      targetingStrategy?: string;
      kind?: string;
    };
    others?: {
      effectRate: number;
      trigger: string;
      targetingStrategy: string;
    }[];
  };
};

function createTargetingStrategy(strategy: string): TargetingCardStrategy {
  switch (strategy) {
    case 'position-based':
      return new TargetedFromPosition();
    case 'target-all':
      return new TargetedAll();
    case 'all-owner-cards':
      return new AllOwnerCards();
    case 'all-allies':
      return new AllAllies();
    case 'self':
      return new Launcher();
    default:
      throw new Error(`Unknown targeting strategy: ${strategy}`);
  }
}

function createTrigger(trigger: string): Trigger {
  switch (trigger) {
    case 'turn-end':
      return new TurnEnd();
    default:
      throw new Error(`Unknown trigger: ${trigger}`);
  }
}

function createSimpleAttack(params: {
  damageRate?: number;
  targetingStrategy?: string;
  effect?: effect;
}): SimpleAttack {
  const damageRate =
    params.damageRate ?? faker.number.float({ min: 1.0, max: 3.0 });
  const targetingStrategy = params.targetingStrategy ?? 'position-based';
  const effect = params.effect ? createEffect(params.effect) : undefined;

  return new SimpleAttack(
    damageRate,
    createTargetingStrategy(targetingStrategy),
    effect,
  );
}

function createSpecial(params: {
  kind?: string;
  damageRate?: number;
  energy?: number;
  targetingStrategy?: string;
}): Special {
  switch (params.kind) {
    case 'specialHealing':
      return createSpecialHealing(params);
    default:
      return createSpecialAttack(params);
  }
}

function createSpecialAttack(params: {
  damageRate?: number;
  energy?: number;
  targetingStrategy?: string;
}): SpecialAttack {
  const damageRate =
    params.damageRate ?? faker.number.int({ min: 2.5, max: 8.0 });
  const energy = params.energy ?? faker.number.int({ min: 30, max: 100 });
  const targetingStrategy = params.targetingStrategy ?? 'position-based';

  return new SpecialAttack(
    damageRate,
    energy,
    createTargetingStrategy(targetingStrategy),
  );
}

function createSpecialHealing(params: {
  damageRate?: number;
  energy?: number;
  targetingStrategy?: string;
}): SpecialHealing {
  const rate = params.damageRate ?? faker.number.int({ min: 2.5, max: 8.0 });
  const energy = params.energy ?? faker.number.int({ min: 30, max: 100 });
  const targetingStrategy = params.targetingStrategy ?? 'position-based';

  return new SpecialHealing(
    rate,
    energy,
    createTargetingStrategy(targetingStrategy),
  );
}

function createsSkills(
  params: {
    effectRate: number;
    trigger: string;
    targetingStrategy: string;
  }[],
): Skill[] {
  return params.map((skill) => {
    return new Healing(
      skill.effectRate,
      createTrigger(skill.trigger),
      createTargetingStrategy(skill.targetingStrategy),
    );
  });
}

export function createFightingCard(params: FightingCardParams): FightingCard {
  const cardName = params.name ?? faker.animal.type();
  const damage = params.attack ?? faker.number.int({ min: 100, max: 800 });
  const defense = params.defense ?? faker.number.int({ min: 100, max: 500 });
  const health = params.health ?? faker.number.int({ min: 2000, max: 10000 });
  const speed = params.speed ?? faker.number.int({ min: 100, max: 500 });
  const agility = params.agility ?? faker.number.int({ min: 10, max: 50 });
  const accuracy = params.accuracy ?? faker.number.int({ min: 10, max: 50 });
  const criticalChance =
    params.criticalChance ?? faker.number.float({ max: 0.9 });

  let specialParams = {};

  if (
    params.skills?.special?.kind === 'specialAttack' ||
    params.skills?.special?.kind === 'specialHealing'
  ) {
    specialParams = params.skills.special;
  }

  return new FightingCard(
    cardName,
    {
      attack: damage,
      defense,
      health,
      speed,
      criticalChance,
      agility,
      accuracy,
    },
    {
      simpleAttack: createSimpleAttack(params.skills?.simpleAttack ?? {}),
      special: createSpecial(specialParams),
      others: createsSkills(params.skills?.others ?? []),
    },
    {
      dodge: new SimpleDodge(),
    },
  );
}
