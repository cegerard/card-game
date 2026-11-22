import { BadRequestException } from '@nestjs/common';
import { SkillKind, TriggerEvent } from '@card-game/shared-types';
import { Randomizer } from '../core/randomizer';
import { Healing } from '../core/cards/skills/healing';
import {
  AlterationSkill,
  LiveRateFactory,
} from '../core/cards/skills/alteration-skill';
import { SupportSkill } from '../core/cards/skills/support';
import { BuffTransferSkill } from '../core/cards/skills/buff-transfer';
import { EnergyGainSkill } from '../core/cards/skills/energy-gain';
import {
  assertLivingAllyScaling,
  HealthCeiling,
  LivingAllyScaling,
  ShieldHold,
} from '../core/cards/@types/alteration/live-rate';
import { AllyHealthBelowThresholdTrigger } from '../core/trigger/ally-health-below-threshold-trigger';
import { AlliedCardByIdStrategy } from '../core/targeting-card-strategies/allied-card-by-id';
import { OtherSkillOf } from './skill-kind-fields';
import {
  asBadRequest,
  buildAlterationStacking,
  buildCooldown,
  buildSkillActivationCondition,
  buildSkillTargeting,
  buildTriggerForSkill,
  ownsActivationCondition,
  requireAllyHealthBelowFields,
  requireBuffType,
  resolveMaxStacks,
} from './skill-wiring-factory';

/*
 * The OTHER skills that back a card or its allies: heals, stat alterations,
 * support, buff transfer and energy.
 */

export function buildHealing(
  skillData: OtherSkillOf<typeof SkillKind.HEALING>,
  ownerId: string,
): Healing {
  return new Healing(
    skillData.name,
    skillData.rate,
    buildTriggerForSkill(skillData, ownerId),
    buildSkillTargeting(skillData),
    skillData.powerId,
    skillData.activationLimit,
    skillData.endEvent,
    skillData.healBasis,
  );
}

export function buildAlteration(
  skillData: OtherSkillOf<typeof SkillKind.ALTERATION>,
  ownerId: string,
  randomizer: Randomizer,
): AlterationSkill {
  if (!skillData.buffType) {
    throw new Error('Alteration skill requires buffType');
  }
  if (!skillData.polarity) {
    throw new Error('Alteration skill requires polarity');
  }
  if (skillData.event === TriggerEvent.ALLY_HEALTH_BELOW) {
    requireAllyHealthBelowFields(skillData);
    return new AlterationSkill({
      name: skillData.name,
      polarity: skillData.polarity,
      attributeType: requireBuffType(skillData.buffType),
      rate: skillData.rate,
      duration: skillData.duration === 0 ? Infinity : (skillData.duration ?? 0),
      trigger: new AllyHealthBelowThresholdTrigger(
        skillData.targetCardId,
        skillData.activationCondition.threshold,
      ),
      targetingStrategy: new AlliedCardByIdStrategy(skillData.targetCardId),
      powerId: skillData.powerId,
    });
  }
  const alterationCondition = ownsActivationCondition(skillData)
    ? undefined
    : buildSkillActivationCondition(skillData, randomizer);
  // duration: 0 means infinite — either permanent (no terminationEvent)
  // or event-bound (removed when terminationEvent fires via EndEventProcessor).
  // The domain uses Infinity to bypass the turn-decrement filter.
  const alterationDuration =
    skillData.duration === 0 ? Infinity : (skillData.duration ?? 0);
  return new AlterationSkill({
    name: skillData.name,
    polarity: skillData.polarity,
    attributeType: requireBuffType(skillData.buffType),
    rate: skillData.rate,
    duration: alterationDuration,
    trigger: buildTriggerForSkill(skillData, ownerId),
    targetingStrategy: buildSkillTargeting(skillData),
    activationCondition: alterationCondition,
    stacking: buildAlterationStacking(
      skillData.stackId,
      resolveMaxStacks(skillData),
      `${skillData.kind} ${skillData.name}`,
    ),
    activationLimit: skillData.activationLimit,
    endEvent: skillData.endEvent,
    terminationEvent: skillData.terminationEvent,
    powerId: skillData.powerId,
    requiredStance: skillData.requiresStance,
    liveRate: buildLiveRate(skillData),
    terminationDamageRate: skillData.terminationDamageRate,
  });
}

export function buildSupport(
  skillData: OtherSkillOf<typeof SkillKind.SUPPORT>,
  ownerId: string,
): SupportSkill {
  return asBadRequest(
    () =>
      new SupportSkill(
        skillData.name,
        buildTriggerForSkill(skillData, ownerId),
        buildSkillTargeting(skillData),
        buildCooldown(skillData.interval),
        {
          shield: skillData.shield,
          cleanse: skillData.cleanse,
          energyCost: skillData.energyCost,
          alterations: skillData.alterations?.map((a) => ({
            type: requireBuffType(a.type),
            rate: a.rate,
            duration: a.duration,
            polarity: a.polarity,
          })),
        },
        skillData.requiresStance,
      ),
  );
}

export function buildBuffTransfer(
  skillData: OtherSkillOf<typeof SkillKind.BUFF_TRANSFER>,
  ownerId: string,
): BuffTransferSkill {
  return new BuffTransferSkill(
    skillData.name,
    requireBuffType(skillData.buffType),
    buildTriggerForSkill(skillData, ownerId),
    buildSkillTargeting(skillData),
    skillData.requiresStance,
    skillData.powerId,
  );
}

export function buildEnergyGain(
  skillData: OtherSkillOf<typeof SkillKind.ENERGY_GAIN>,
  ownerId: string,
): EnergyGainSkill {
  return asBadRequest(
    () =>
      new EnergyGainSkill(
        skillData.name,
        skillData.amount,
        buildTriggerForSkill(skillData, ownerId),
      ),
  );
}

/**
 * The live rate an ALTERATION asks for: earned per living ally, held only
 * while its bearer is under a health ratio, or only while it holds a named
 * shield. One at most: they answer different questions and their product
 * would read as none of them.
 */
function buildLiveRate(
  skillData: OtherSkillOf<typeof SkillKind.ALTERATION>,
): LiveRateFactory | undefined {
  const { perLivingAlly, whileHealthBelow, whileShielded, rate } = skillData;
  const asked = [perLivingAlly, whileHealthBelow, whileShielded].filter(
    (field) => field !== undefined,
  );
  if (asked.length > 1) {
    throw new BadRequestException(
      'ALTERATION takes one of perLivingAlly, whileHealthBelow and whileShielded',
    );
  }
  if (whileShielded !== undefined) {
    const hold = new ShieldHold(rate, whileShielded);
    return () => hold;
  }
  if (perLivingAlly) {
    asBadRequest(() => assertLivingAllyScaling(rate, perLivingAlly.maxRate));
    return (team) => new LivingAllyScaling(rate, perLivingAlly.maxRate, team);
  }
  if (whileHealthBelow !== undefined) {
    const ceiling = new HealthCeiling(rate, whileHealthBelow);
    return () => ceiling;
  }
  return undefined;
}
