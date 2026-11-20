import { BadRequestException } from '@nestjs/common';
import {
  AlterationConditionType,
  SkillKind,
  TargetingStrategy,
  TriggerEvent,
} from '@card-game/shared-types';
import { OtherSkillDto } from './dto/fight-data.dto';
import { Randomizer } from '../core/randomizer';
import { Alteration } from '../core/cards/@types/alteration/alteration';
import { HealthThresholdCondition } from '../core/cards/@types/skill-activation-conditions/health-threshold-condition';
import { RampingChance } from '../core/cards/@types/stance/ramping-chance';
import { ShieldSkill } from '../core/cards/skills/shield';
import { ProtectionSkill } from '../core/cards/skills/protection';
import { StanceSkill } from '../core/cards/skills/stance';
import { ConcealmentSkill } from '../core/cards/skills/concealment';
import { TransformationSkill } from '../core/cards/skills/transformation';
import { TargetingOverrideSkill } from '../core/cards/skills/targeting-override';
import { TargetedCard } from '../core/targeting-card-strategies/targeted-card';
import { buildBattlefield } from './battlefield-factory';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildTriggerStrategy } from './trigger-factory';
import { OtherSkillOf } from './skill-kind-fields';
import {
  asBadRequest,
  buildCooldown,
  buildSkillTargeting,
  buildTriggerForSkill,
  requireBuffType,
} from './skill-wiring-factory';

/*
 * The OTHER skills that change how a card stands in the fight: shield,
 * protection, stance, concealment, transformation and targeting override.
 */

export function buildShield(
  skillData: OtherSkillOf<typeof SkillKind.SHIELD>,
): ShieldSkill {
  if (!skillData.activationCondition) {
    throw new Error('SHIELD skill requires activationCondition');
  }
  if (
    skillData.activationCondition.type !==
    AlterationConditionType.HEALTH_THRESHOLD
  ) {
    throw new Error(
      'SHIELD skill activationCondition must be of type health-threshold',
    );
  }
  if (
    !skillData.activationCondition.operator ||
    skillData.activationCondition.threshold === undefined
  ) {
    throw new Error(
      'SHIELD skill activationCondition requires operator and threshold',
    );
  }
  return new ShieldSkill(
    skillData.name,
    skillData.rate,
    buildSkillTargeting(skillData),
    new HealthThresholdCondition(
      skillData.activationCondition.operator as 'below' | 'above',
      skillData.activationCondition.threshold,
    ),
  );
}

export function buildProtection(
  skillData: OtherSkillOf<typeof SkillKind.PROTECTION>,
  ownerId: string,
): ProtectionSkill {
  if (!skillData.duration) {
    throw new BadRequestException('PROTECTION skill requires duration');
  }
  return new ProtectionSkill(
    skillData.name,
    skillData.duration,
    buildTriggerForSkill(skillData, ownerId),
    buildSkillTargeting(skillData),
    skillData.activationLimit,
    skillData.powerId,
  );
}

export function buildStance(
  skillData: OtherSkillOf<typeof SkillKind.STANCE>,
  ownerId: string,
  randomizer: Randomizer,
): StanceSkill {
  const ramping = skillData.rampingChance;

  return asBadRequest(
    () =>
      new StanceSkill(
        skillData.name,
        skillData.stanceActivation,
        buildTriggerForSkill(skillData, ownerId),
        {
          powerId: skillData.powerId,
          alterations: buildStatAlterations(skillData),
          chance: ramping
            ? new RampingChance(
                ramping.startChance,
                ramping.increment,
                ramping.fromTurn,
                randomizer,
              )
            : undefined,
        },
      ),
  );
}

export function buildConcealment(
  skillData: OtherSkillOf<typeof SkillKind.CONCEALMENT>,
  ownerId: string,
): ConcealmentSkill {
  return asBadRequest(
    () =>
      new ConcealmentSkill(
        skillData.name,
        buildTriggerForSkill(skillData, ownerId),
        {
          duration: skillData.duration,
          powerId: skillData.powerId,
          stanceActivation: skillData.stanceActivation,
          condition: buildCooldown(skillData.interval),
          requiresUndamaged: skillData.requiresUndamaged,
        },
      ),
  );
}

export function buildTransformation(
  skillData: OtherSkillOf<typeof SkillKind.TRANSFORMATION>,
  ownerId: string,
): TransformationSkill {
  const threshold = skillData.activationCondition?.threshold;
  if (threshold === undefined) {
    throw new Error(
      'TRANSFORMATION skill requires an activationCondition threshold',
    );
  }
  return new TransformationSkill({
    name: skillData.name,
    activationCondition: new HealthThresholdCondition(
      (skillData.activationCondition.operator as 'below' | 'above') ?? 'below',
      threshold,
    ),
    duration: skillData.duration,
    alterations: buildStatAlterations(skillData),
    lifestealRate: skillData.lifestealRate,
    statusImmunity: skillData.statusImmunity,
    endCostRate: skillData.endCostRate,
    stanceActivations: skillData.stanceActivations,
    poisonSurge: skillData.poisonSurge,
    activationTrigger: buildTransformationTrigger(skillData, ownerId),
    criticalDamageRate: skillData.criticalDamageRate,
    battlefield: buildBattlefield(skillData.battlefield),
  });
}

export function buildTargetingOverride(
  skillData: OtherSkillOf<typeof SkillKind.TARGETING_OVERRIDE>,
  ownerId: string,
): TargetingOverrideSkill {
  if (!skillData.terminationEvent) {
    throw new Error('Targeting override skill requires terminationEvent');
  }
  if (skillData.targetingStrategy === TargetingStrategy.TARGETED_CARD) {
    return new TargetingOverrideSkill(
      skillData.name,
      undefined,
      skillData.terminationEvent,
      buildTriggerForSkill(skillData, ownerId),
      skillData.powerId,
      (ctx) => {
        if (!ctx.killerCard) return null;
        return new TargetedCard(ctx.killerCard.id);
      },
    );
  }
  return new TargetingOverrideSkill(
    skillData.name,
    buildSkillTargeting(skillData),
    skillData.terminationEvent,
    buildTriggerForSkill(skillData, ownerId),
    skillData.powerId,
  );
}

/**
 * The event setting a transformation off besides its own threshold. An ally
 * falling low names its threshold apart, the skill one being its owner health.
 */
function buildTransformationTrigger(
  skillData: OtherSkillOf<typeof SkillKind.TRANSFORMATION>,
  ownerId: string,
) {
  if (!skillData.activationEvent) return undefined;
  if (skillData.activationEvent === TriggerEvent.ANY_ALLY_HEALTH_BELOW) {
    return buildTriggerForSkill(
      {
        ...skillData,
        event: skillData.activationEvent,
        activationCondition: { threshold: skillData.activationEventThreshold },
      } as OtherSkillDto,
      ownerId,
    );
  }
  return asBadRequest(() => buildTriggerStrategy(skillData.activationEvent));
}

function buildStatAlterations(
  skillData: Pick<OtherSkillDto, 'statAlterations'>,
): Alteration[] {
  return (skillData.statAlterations ?? []).map(
    (a) =>
      new Alteration(
        requireBuffType(a.type),
        a.rate,
        a.duration,
        buildTargetingStrategy(a.targetingStrategy),
        undefined,
        undefined,
        a.terminationEvent,
        a.polarity,
      ),
  );
}
