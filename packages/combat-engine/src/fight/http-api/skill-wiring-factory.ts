import { BadRequestException } from '@nestjs/common';
import {
  AlterationConditionType,
  OtherSkillDto,
  BuffType,
  TriggerEvent,
  TargetingStrategy,
} from './dto/fight-data.dto';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildAlterationCondition } from './alteration-condition-factory';
import { buildTriggerStrategy } from './trigger-factory';
import { Trigger } from '../core/trigger/trigger';
import { AllyHealthBelowThresholdTrigger } from '../core/trigger/ally-health-below-threshold-trigger';
import { AnyAllyHealthBelowThresholdTrigger } from '../core/trigger/any-ally-health-below-threshold-trigger';
import { SelfDeathTrigger } from '../core/trigger/self-death';
import { BleedStacksAppliedTrigger } from '../core/trigger/bleed-stacks-applied';
import { FirstBleedingEnemyStrategy } from '../core/targeting-card-strategies/first-bleeding-enemy';
import { AlterationStacking } from '../core/cards/@types/alteration/alteration-detail';
import { EnemyKilledTrigger } from '../core/trigger/enemy-killed';

export function asBadRequest<T>(build: () => T): T {
  try {
    return build();
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}

/**
 * A stack budget needs both its id and its cap: half of one is a malformed
 * request, not a silent no-cap, so it is rejected rather than ignored.
 */
export function buildAlterationStacking(
  stackId: string | undefined,
  maxStacks: number | undefined,
  owner: string,
): AlterationStacking | undefined {
  if (stackId === undefined && maxStacks === undefined) return undefined;
  if (stackId === undefined || maxStacks === undefined) {
    throw new BadRequestException(
      `${owner} requires both stackId and a max stacks value to cap an alteration pile`,
    );
  }
  return { id: stackId, maxStacks };
}

/**
 * Resolves the targeting a triggered skill declares. Some strategies name
 * their target up front (`targetCardId`), others resolve it against the live
 * board from a health threshold, so both are handed over.
 */
export function buildSkillTargeting(skillData: OtherSkillDto) {
  if (skillData.targetingStrategy === TargetingStrategy.FIRST_BLEEDING_ENEMY) {
    return new FirstBleedingEnemyStrategy(skillData.stackThreshold);
  }
  const threshold =
    skillData.targetingStrategy === TargetingStrategy.MOST_WOUNDED_ALLY
      ? requireThreshold(skillData, skillData.targetingStrategy)
      : skillData.activationCondition?.threshold;

  return buildTargetingStrategy(
    skillData.targetingStrategy,
    skillData.targetCardId,
    threshold,
  );
}

/**
 * Whether the skill event already consumes `activationCondition` as its own
 * threshold. It then says "an ally fell low", and reusing it as the skill
 * activation condition would gate the skill a second time on the *caster*
 * health — a guardian in perfect shape would never answer its wounded ally.
 */
export function ownsActivationCondition(skillData: OtherSkillDto): boolean {
  return (
    skillData.event === TriggerEvent.ANY_ALLY_HEALTH_BELOW ||
    skillData.event === TriggerEvent.ENEMY_KILLED
  );
}

export function buildSkillActivationCondition(skillData: OtherSkillDto) {
  if (!skillData.activationCondition) return undefined;

  return buildAlterationCondition(skillData.activationCondition.type, {
    allyName: skillData.activationCondition.allyName,
    threshold: skillData.activationCondition.threshold,
    operator: skillData.activationCondition.operator,
    probability: skillData.activationCondition.probability,
  });
}

/** The stack cap of a skill, `debuffMaxStacks` being the former name of `maxStacks`. */
export function resolveMaxStacks(skillData: OtherSkillDto): number | undefined {
  const { maxStacks, debuffMaxStacks } = skillData;
  if (
    maxStacks !== undefined &&
    debuffMaxStacks !== undefined &&
    maxStacks !== debuffMaxStacks
  ) {
    throw new BadRequestException(
      `${skillData.kind} ${skillData.name}: maxStacks and its alias debuffMaxStacks disagree`,
    );
  }
  return maxStacks ?? debuffMaxStacks;
}

/**
 * The health threshold both the any-ally trigger and the most-wounded-ally
 * targeting read. Missing, it is malformed input rather than a runtime
 * failure, so it answers 400 like the other domain checks here.
 */
function requireThreshold(skillData: OtherSkillDto, requiredBy: string) {
  const threshold = skillData.activationCondition?.threshold;
  if (threshold === undefined) {
    throw new BadRequestException(
      `${requiredBy} requires activationCondition.threshold`,
    );
  }
  return threshold;
}

export function buildTriggerForSkill(
  skillData: OtherSkillDto,
  ownerId: string,
): Trigger {
  // A card reacting to its own death names nobody: the trigger is its own id.
  if (skillData.event === TriggerEvent.SELF_DEATH) {
    return new SelfDeathTrigger(ownerId);
  }

  if (skillData.event === TriggerEvent.ENEMY_KILLED) {
    const condition = skillData.activationCondition;
    if (
      condition?.type !== undefined &&
      condition.type !== AlterationConditionType.HEALTH_THRESHOLD
    ) {
      throw new BadRequestException(
        'enemy-killed activationCondition must be of type health-threshold',
      );
    }
    if (condition?.operator !== undefined || condition?.allyName) {
      throw new BadRequestException(
        'enemy-killed activationCondition only accepts type and threshold',
      );
    }
    try {
      return new EnemyKilledTrigger(skillData.activationCondition?.threshold);
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  if (skillData.event === TriggerEvent.BLEED_STACKS_APPLIED) {
    return new BleedStacksAppliedTrigger(skillData.stackThreshold);
  }

  if (skillData.event === TriggerEvent.ALLY_HEALTH_BELOW) {
    requireAllyHealthBelowFields(skillData);
    return new AllyHealthBelowThresholdTrigger(
      skillData.targetCardId,
      skillData.activationCondition.threshold,
    );
  }

  if (skillData.event === TriggerEvent.ANY_ALLY_HEALTH_BELOW) {
    return new AnyAllyHealthBelowThresholdTrigger(
      requireThreshold(skillData, skillData.event),
      ownerId,
    );
  }

  const dormantConfig =
    skillData.event === TriggerEvent.DORMANT
      ? {
          activationEvent: skillData.activationEvent,
          activationTargetCardId: skillData.activationTargetCardId,
          replacementEvent: skillData.replacementEvent,
        }
      : undefined;
  return buildTriggerStrategy(
    skillData.event,
    skillData.targetCardId,
    dormantConfig,
  );
}

export function requireAllyHealthBelowFields(skillData: OtherSkillDto): void {
  if (!skillData.activationCondition) {
    throw new BadRequestException(
      `${skillData.kind} with ally-health-below requires activationCondition`,
    );
  }
  if (!skillData.targetCardId) {
    throw new BadRequestException(
      `${skillData.kind} with ally-health-below requires targetCardId`,
    );
  }
}

export function mapAlterationType(
  buffType: BuffType,
): import('../core/cards/@types/alteration/alteration-type').AlterationType {
  const BUFF_TYPE_MAP = {
    [BuffType.ATTACK]: 'attack' as const,
    [BuffType.DEFENSE]: 'defense' as const,
    [BuffType.AGILITY]: 'agility' as const,
    [BuffType.ACCURACY]: 'accuracy' as const,
    [BuffType.SPEED]: 'speed' as const,
    [BuffType.CRITICAL_CHANCE]: 'criticalChance' as const,
    [BuffType.REGENERATION]: 'regeneration' as const,
    [BuffType.RESISTANCE]: 'resistance' as const,
  };

  const result = BUFF_TYPE_MAP[buffType];
  if (!result) throw new Error(`Unknown buff type: ${buffType}`);
  return result;
}
