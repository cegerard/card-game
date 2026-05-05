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
import { AlterationSkill } from '../../src/fight/core/cards/skills/alteration-skill';
import { TurnEnd } from '../../src/fight/core/trigger/turn-end';
import { NextAction } from '../../src/fight/core/trigger/next-action';
import { DeathTrigger } from '../../src/fight/core/trigger/death-trigger';
import { DynamicTrigger } from '../../src/fight/core/trigger/dynamic-trigger';
import { Trigger } from '../../src/fight/core/trigger/trigger';
import { createEffect } from './effect';
import {
  BuffType,
  DebuffType,
} from '../../src/fight/core/cards/@types/alteration/type';
import { Skill } from '../../src/fight/core/cards/skills/skill';
import { TargetingOverrideSkill } from '../../src/fight/core/cards/skills/targeting-override';
import { Alteration } from '../../src/fight/core/cards/@types/alteration/alteration';
import { AlterationCondition } from '../../src/fight/core/cards/@types/alteration/alteration-condition';
import { Element } from '../../src/fight/core/cards/@types/damage/element';
import { DamageComposition } from '../../src/fight/core/cards/@types/damage/damage-composition';
import { DamageType } from '../../src/fight/core/cards/@types/damage/damage-type';

type effect = {
  type: string;
  rate: number;
  level: 1 | 2 | 3;
};

type FightingCardParams = {
  id?: string;
  name?: string;
  attack?: number;
  defense?: number;
  health?: number;
  speed?: number;
  criticalChance?: number;
  agility?: number;
  accuracy?: number;
  element?: Element;
  skills?: {
    simpleAttack?: {
      name?: string;
      damages?: DamageComposition[];
      targetingStrategy?: string;
      effect?: effect;
    };
    special?: {
      name?: string;
      damages?: DamageComposition[];
      damageRate?: number;
      energy?: number;
      targetingStrategy?: string;
      kind?: string;
      effect?: effect;
      buffs?: {
        buffType: BuffType;
        buffRate: number;
        buffDuration: number;
        buffTargetingStrategy: string;
      }[];
    };
    others?: (
      | {
          effectRate: number;
          trigger: string;
          targetingStrategy: string;
          targetCardId?: string;
          activationEvent?: string;
          activationTargetCardId?: string;
          replacementEvent?: string;
          powerId?: string;
        }
      | {
          buffType: BuffType;
          buffRate: number;
          duration: number;
          trigger: string;
          targetingStrategy: string;
          targetCardId?: string;
          activationLimit?: number;
          endEvent?: string;
          terminationEvent?: string;
          activationCondition?: AlterationCondition;
          activationEvent?: string;
          activationTargetCardId?: string;
          replacementEvent?: string;
          powerId?: string;
        }
      | {
          debuffType: DebuffType;
          debuffRate: number;
          duration: number;
          trigger: string;
          targetingStrategy: string;
          targetCardId?: string;
          activationCondition?: AlterationCondition;
          activationEvent?: string;
          activationTargetCardId?: string;
          replacementEvent?: string;
          powerId?: string;
        }
      | {
          kind: 'TARGETING_OVERRIDE';
          targetingStrategy: string;
          terminationEvent: string;
          trigger: string;
          targetCardId?: string;
          activationEvent?: string;
          activationTargetCardId?: string;
          replacementEvent?: string;
          powerId?: string;
        }
    )[];
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

function createTrigger(
  trigger: string,
  targetCardId?: string,
  dormantConfig?: {
    activationEvent: string;
    activationTargetCardId: string;
    replacementEvent: string;
  },
): Trigger {
  if (trigger === 'dormant') {
    if (!dormantConfig) {
      throw new Error('Dormant trigger requires dormantConfig');
    }
    const activationTrigger = createTrigger(
      dormantConfig.activationEvent,
      dormantConfig.activationTargetCardId,
    );
    return new DynamicTrigger(activationTrigger, (cardId: string) =>
      createTrigger(dormantConfig.replacementEvent, cardId),
    );
  }
  switch (trigger) {
    case 'turn-end':
      return new TurnEnd();
    case 'next-action':
      return new NextAction();
    case 'ally-death':
      if (!targetCardId) {
        throw new Error('Ally death trigger requires targetCardId');
      }
      return new DeathTrigger('ally-death', targetCardId);
    case 'enemy-death':
      if (!targetCardId) {
        throw new Error('Enemy death trigger requires targetCardId');
      }
      return new DeathTrigger('enemy-death', targetCardId);
    default:
      throw new Error(`Unknown trigger: ${trigger}`);
  }
}

function createSimpleAttack(params: {
  name?: string;
  damages?: DamageComposition[];
  targetingStrategy?: string;
  effect?: effect;
}): SimpleAttack {
  const damages = params.damages ?? [
    new DamageComposition(
      DamageType.PHYSICAL,
      faker.number.float({ min: 1.0, max: 3.0 }),
    ),
  ];
  const targetingStrategy = params.targetingStrategy ?? 'position-based';
  const effects = params.effect ? [createEffect(params.effect)] : undefined;

  return new SimpleAttack(
    params.name ?? faker.word.noun(),
    damages,
    createTargetingStrategy(targetingStrategy),
    effects,
  );
}

function createSpecial(params: {
  name?: string;
  kind?: string;
  damages?: DamageComposition[];
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
  name?: string;
  damages?: DamageComposition[];
  energy?: number;
  targetingStrategy?: string;
  effect?: effect;
  buffs?: {
    buffType: BuffType;
    buffRate: number;
    buffDuration: number;
    buffTargetingStrategy: string;
  }[];
}): SpecialAttack {
  const damages = params.damages ?? [
    new DamageComposition(
      DamageType.PHYSICAL,
      faker.number.float({ min: 2.5, max: 8.0 }),
    ),
  ];
  const energy = params.energy ?? faker.number.int({ min: 30, max: 100 });
  const targetingStrategy = params.targetingStrategy ?? 'position-based';
  const effect = params.effect ? createEffect(params.effect) : undefined;

  const buffApplication =
    params.buffs && params.buffs.length > 0
      ? params.buffs.map(
          (b) =>
            new Alteration(
              b.buffType,
              b.buffRate,
              b.buffDuration,
              createTargetingStrategy(b.buffTargetingStrategy),
            ),
        )
      : undefined;

  return new SpecialAttack(
    params.name ?? faker.word.noun(),
    damages,
    energy,
    createTargetingStrategy(targetingStrategy),
    effect,
    buffApplication,
  );
}

function createSpecialHealing(params: {
  name?: string;
  damageRate?: number;
  energy?: number;
  targetingStrategy?: string;
}): SpecialHealing {
  const rate = params.damageRate ?? faker.number.int({ min: 2.5, max: 8.0 });
  const energy = params.energy ?? faker.number.int({ min: 30, max: 100 });
  const targetingStrategy = params.targetingStrategy ?? 'position-based';

  return new SpecialHealing(
    params.name ?? faker.word.noun(),
    rate,
    energy,
    createTargetingStrategy(targetingStrategy),
  );
}

function dormantConfig(skill: {
  activationEvent?: string;
  activationTargetCardId?: string;
  replacementEvent?: string;
}) {
  if (
    skill.activationEvent &&
    skill.activationTargetCardId &&
    skill.replacementEvent
  ) {
    return {
      activationEvent: skill.activationEvent,
      activationTargetCardId: skill.activationTargetCardId,
      replacementEvent: skill.replacementEvent,
    };
  }
  return undefined;
}

function createsSkills(
  params: (
    | {
        effectRate: number;
        trigger: string;
        targetingStrategy: string;
        targetCardId?: string;
        activationEvent?: string;
        activationTargetCardId?: string;
        replacementEvent?: string;
        powerId?: string;
      }
    | {
        buffType: BuffType;
        buffRate: number;
        duration: number;
        trigger: string;
        targetingStrategy: string;
        targetCardId?: string;
        activationLimit?: number;
        endEvent?: string;
        terminationEvent?: string;
        activationCondition?: AlterationCondition;
        activationEvent?: string;
        activationTargetCardId?: string;
        replacementEvent?: string;
        powerId?: string;
      }
    | {
        debuffType: DebuffType;
        debuffRate: number;
        duration: number;
        trigger: string;
        targetingStrategy: string;
        targetCardId?: string;
        activationCondition?: AlterationCondition;
        activationEvent?: string;
        activationTargetCardId?: string;
        replacementEvent?: string;
        powerId?: string;
      }
    | {
        kind: 'TARGETING_OVERRIDE';
        targetingStrategy: string;
        terminationEvent: string;
        trigger: string;
        targetCardId?: string;
        activationEvent?: string;
        activationTargetCardId?: string;
        replacementEvent?: string;
        powerId?: string;
      }
  )[],
): Skill[] {
  return params.map((skill) => {
    const config = dormantConfig(skill);
    if ('effectRate' in skill) {
      return new Healing(
        faker.word.noun(),
        skill.effectRate,
        createTrigger(skill.trigger, skill.targetCardId, config),
        createTargetingStrategy(skill.targetingStrategy),
        skill.powerId,
      );
    } else if ('buffType' in skill) {
      return new AlterationSkill({
        name: faker.word.noun(),
        polarity: 'buff',
        attributeType: skill.buffType,
        rate: skill.buffRate,
        duration: skill.duration,
        trigger: createTrigger(skill.trigger, skill.targetCardId, config),
        targetingStrategy: createTargetingStrategy(skill.targetingStrategy),
        activationLimit: skill.activationLimit,
        endEvent: skill.endEvent,
        terminationEvent: skill.terminationEvent,
        activationCondition: skill.activationCondition,
        powerId: skill.powerId,
      });
    } else if ('debuffType' in skill) {
      return new AlterationSkill({
        name: faker.word.noun(),
        polarity: 'debuff',
        attributeType: skill.debuffType,
        rate: skill.debuffRate,
        duration: skill.duration,
        trigger: createTrigger(skill.trigger, skill.targetCardId, config),
        targetingStrategy: createTargetingStrategy(skill.targetingStrategy),
        activationCondition: skill.activationCondition,
        powerId: skill.powerId,
      });
    } else {
      return new TargetingOverrideSkill(
        faker.word.noun(),
        createTargetingStrategy(skill.targetingStrategy),
        skill.terminationEvent,
        createTrigger(skill.trigger, skill.targetCardId, config),
        skill.powerId,
      );
    }
  });
}

export function createFightingCard(
  params: FightingCardParams = {},
): FightingCard {
  const id = params.id ?? faker.string.uuid();
  const cardName = params.name ?? faker.animal.type();
  const damage = params.attack ?? faker.number.int({ min: 100, max: 800 });
  const defense = params.defense ?? faker.number.int({ min: 100, max: 500 });
  const health = params.health ?? faker.number.int({ min: 2000, max: 10000 });
  const speed = params.speed ?? faker.number.int({ min: 100, max: 500 });
  const agility = params.agility ?? faker.number.int({ min: 10, max: 50 });
  const accuracy = params.accuracy ?? faker.number.int({ min: 10, max: 50 });
  const criticalChance =
    params.criticalChance ?? faker.number.float({ max: 0.9 });
  const element = params.element ?? Element.PHYSICAL;

  let specialParams = {};

  if (
    params.skills?.special?.kind === 'specialAttack' ||
    params.skills?.special?.kind === 'specialHealing'
  ) {
    specialParams = params.skills.special;
  }

  return new FightingCard(
    id,
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
      simpleAttack: createSimpleAttack({
        name: params.skills?.simpleAttack?.name,
        ...params.skills?.simpleAttack,
      }),
      special: createSpecial({
        name: params.skills?.special?.name,
        ...specialParams,
      }),
      others: createsSkills(params.skills?.others ?? []),
    },
    {
      dodge: new SimpleDodge(),
    },
    element,
  );
}
