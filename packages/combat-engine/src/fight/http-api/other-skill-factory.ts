import { BadRequestException } from '@nestjs/common';
import {
  AlterationConditionType,
  OtherSkillDto,
  SkillKind,
  RateBasisDto,
  TriggerEvent,
  TargetingStrategy,
} from './dto/fight-data.dto';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { Healing } from '../core/cards/skills/healing';
import { AlterationSkill } from '../core/cards/skills/alteration-skill';
import { Alteration } from '../core/cards/@types/alteration/alteration';
import { Skill } from '../core/cards/skills/skill';
import { TargetingOverrideSkill } from '../core/cards/skills/targeting-override';
import { ShieldSkill } from '../core/cards/skills/shield';
import { ProtectionSkill } from '../core/cards/skills/protection';
import { TransformationSkill } from '../core/cards/skills/transformation';
import { HealthThresholdCondition } from '../core/cards/@types/skill-activation-conditions/health-threshold-condition';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ConditionalAttack } from '../core/cards/skills/conditional-attack';
import { EveryNTurnsCondition } from '../core/cards/@types/attack/conditions/every-n-turns-condition';
import { AlwaysTrueAttackCondition } from '../core/cards/@types/attack/conditions/always-true-attack-condition';
import { AttackCondition } from '../core/cards/@types/attack/attack-condition';
import { AllyHealthBelowThresholdTrigger } from '../core/trigger/ally-health-below-threshold-trigger';
import { BuffTransferSkill } from '../core/cards/skills/buff-transfer';
import { StanceSkill } from '../core/cards/skills/stance';
import { RampingChance } from '../core/cards/@types/stance/ramping-chance';
import { MathRandomizer } from '../tools/math-randomizer';
import { BleedExplosionSkill } from '../core/cards/skills/bleed-explosion';
import { RealDamageSkill } from '../core/cards/skills/real-damage';
import { AfflictionSkill } from '../core/cards/skills/affliction';
import { BleedDetonation } from '../core/cards/@types/attack/bleed-detonation';
import { Splash } from '../core/cards/@types/attack/splash';
import { LowHealthDebuff } from '../core/cards/@types/attack/low-health-debuff';
import { AlliedCardByIdStrategy } from '../core/targeting-card-strategies/allied-card-by-id';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { AttackSkill } from '../core/cards/skills/attack-skill';
import { TargetedCard } from '../core/targeting-card-strategies/targeted-card';
import { HitAlterations } from '../core/cards/@types/attack/hit-alterations';
import { ConcealmentSkill } from '../core/cards/skills/concealment';
import { buildEffect, buildEffects } from './attack-effect-factory';
import { buildExecution } from './attack-skill-factory';
import {
  asBadRequest,
  buildAlterationStacking,
  buildSkillActivationCondition,
  buildSkillTargeting,
  buildTriggerForSkill,
  mapAlterationType,
  ownsActivationCondition,
  requireAllyHealthBelowFields,
  resolveMaxStacks,
} from './skill-wiring-factory';

export function createOtherSkill(
  skillData: OtherSkillDto,
  ownerId: string,
): Skill {
  switch (skillData.kind) {
    case SkillKind.HEALING:
      return buildHealing(skillData, ownerId);
    case SkillKind.ALTERATION:
      return buildAlteration(skillData, ownerId);
    case SkillKind.CONDITIONAL_ATTACK:
      return buildConditionalAttack(skillData, ownerId);
    case SkillKind.TARGETING_OVERRIDE:
      return buildTargetingOverride(skillData, ownerId);
    case SkillKind.TRANSFORMATION:
      return buildTransformation(skillData);
    case SkillKind.SHIELD:
      return buildShield(skillData);
    case SkillKind.PROTECTION:
      return buildProtection(skillData, ownerId);
    case SkillKind.STANCE:
      return buildStance(skillData, ownerId);
    case SkillKind.CONCEALMENT:
      return buildConcealment(skillData, ownerId);
    case SkillKind.BUFF_TRANSFER:
      return new BuffTransferSkill(
        skillData.name,
        mapAlterationType(skillData.buffType),
        buildTriggerForSkill(skillData, ownerId),
        buildSkillTargeting(skillData),
        skillData.requiresStance,
        skillData.powerId,
      );
    case SkillKind.BLEED_DETONATION:
      return new BleedExplosionSkill(
        skillData.name,
        skillData.rate,
        buildTriggerForSkill(skillData, ownerId),
        skillData.requiresStance,
      );
    case SkillKind.REAL_DAMAGE:
      return asBadRequest(
        () =>
          new RealDamageSkill(
            skillData.name,
            skillData.rate,
            skillData.basis ?? RateBasisDto.SOURCE_ATTACK,
            buildTriggerForSkill(skillData, ownerId),
            buildSkillTargeting(skillData),
            skillData.requiresStance,
          ),
      );
    case SkillKind.AFFLICTION:
      return new AfflictionSkill(
        skillData.name,
        buildEffect(skillData.effect),
        buildTriggerForSkill(skillData, ownerId),
        buildSkillTargeting(skillData),
        skillData.requiresStance,
      );
    case SkillKind.SURVIVE:
      throw new Error('SURVIVE skill must not appear in others skill list');
    case SkillKind.DAMAGE_REDUCTION:
    case SkillKind.DODGE_BONUS_DENIAL:
    case SkillKind.BLEED_STACK_SCALING:
    case SkillKind.BLEED_EMPOWERMENT:
    case SkillKind.LOW_HEALTH_TARGET_BONUS:
    case SkillKind.POISONED_ENEMY_AGILITY:
      throw new Error(
        `${skillData.kind} skill must not appear in others skill list`,
      );
    default:
      throw new Error(`Unknown skill kind: ${skillData.kind}`);
  }
}

function buildHealing(skillData: OtherSkillDto, ownerId: string): Healing {
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

function buildAlteration(
  skillData: OtherSkillDto,
  ownerId: string,
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
      attributeType: mapAlterationType(skillData.buffType),
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
    : buildSkillActivationCondition(skillData);
  // duration: 0 means infinite — either permanent (no terminationEvent)
  // or event-bound (removed when terminationEvent fires via EndEventProcessor).
  // The domain uses Infinity to bypass the turn-decrement filter.
  const alterationDuration =
    skillData.duration === 0 ? Infinity : (skillData.duration ?? 0);
  return new AlterationSkill({
    name: skillData.name,
    polarity: skillData.polarity,
    attributeType: mapAlterationType(skillData.buffType),
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
  });
}

function buildConditionalAttack(
  skillData: OtherSkillDto,
  ownerId: string,
): ConditionalAttack {
  const attackSkill = buildConditionalAttackSkill(skillData);
  return asBadRequest(
    () =>
      new ConditionalAttack(
        skillData.name,
        attackSkill,
        buildCooldown(skillData.interval),
        buildTriggerForSkill(skillData, ownerId),
        {
          powerId: skillData.powerId,
          requiredStance: skillData.requiresStance,
          energyCost: skillData.energyCost,
          splash: skillData.splash
            ? new Splash(
                skillData.splash.name,
                skillData.splash.damages.map(
                  (d) => new DamageComposition(d.type, d.rate),
                ),
                buildEffects(skillData.splash.effects),
              )
            : undefined,
          lowHealthDebuff: skillData.onLowHealthAfterHit
            ? new LowHealthDebuff(
                skillData.onLowHealthAfterHit.name,
                skillData.onLowHealthAfterHit.threshold,
                skillData.onLowHealthAfterHit.debuffs.map((debuff) => ({
                  type: mapAlterationType(debuff.type),
                  rate: debuff.rate,
                  duration: debuff.duration,
                })),
              )
            : undefined,
          stanceActivation: skillData.stanceActivation,
          requiresUndamaged: skillData.requiresUndamaged,
          hitAlterations: buildHitAlterations(skillData),
          endsStance: skillData.endsStance,
          execution: buildExecution(skillData.execution),
          activationLimit: skillData.activationLimit,
          endEvent: skillData.endEvent,
        },
      ),
  );
}

function buildConditionalAttackSkill(skillData: OtherSkillDto): AttackSkill {
  if (skillData.bleedDetonation && skillData.hits) {
    throw new BadRequestException(
      'CONDITIONAL_ATTACK bleedDetonation cannot be combined with hits',
    );
  }
  const caDamages = (skillData.damages ?? []).map(
    (d) => new DamageComposition(d.type, d.rate),
  );
  const caEffects = skillData.effect
    ? [buildEffect(skillData.effect)]
    : undefined;
  const caComboFinisher = skillData.comboFinisher
    ? skillData.comboFinisher.map((d) => new DamageComposition(d.type, d.rate))
    : undefined;
  return skillData.hits
    ? new MultipleAttack(
        skillData.name,
        skillData.hits,
        caDamages,
        buildSkillTargeting(skillData),
        skillData.amplifier ?? 0,
        caEffects,
        caComboFinisher,
        buildEffects(skillData.comboFinisherEffects),
        undefined,
        skillData.defensePenetration,
      )
    : new SimpleAttack(
        skillData.name,
        caDamages,
        buildSkillTargeting(skillData),
        caEffects,
        undefined,
        skillData.defensePenetration,
        skillData.bleedDetonation
          ? new BleedDetonation(skillData.bleedDetonation.ratePerStack)
          : undefined,
      );
}

function buildTargetingOverride(
  skillData: OtherSkillDto,
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

function buildTransformation(skillData: OtherSkillDto): TransformationSkill {
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
  });
}

function buildStatAlterations(skillData: OtherSkillDto): Alteration[] {
  return (skillData.statAlterations ?? []).map(
    (a) =>
      new Alteration(
        mapAlterationType(a.type),
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

function buildStance(skillData: OtherSkillDto, ownerId: string): StanceSkill {
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
                new MathRandomizer(),
              )
            : undefined,
        },
      ),
  );
}

function buildShield(skillData: OtherSkillDto): ShieldSkill {
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

function buildProtection(
  skillData: OtherSkillDto,
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

function buildConcealment(
  skillData: OtherSkillDto,
  ownerId: string,
): ConcealmentSkill {
  try {
    return new ConcealmentSkill(
      skillData.name,
      buildTriggerForSkill(skillData, ownerId),
      {
        duration: skillData.duration,
        powerId: skillData.powerId,
        stanceActivation: skillData.stanceActivation,
        condition: buildCooldown(skillData.interval),
        requiresUndamaged: skillData.requiresUndamaged,
      },
    );
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }
}

function buildCooldown(interval?: number): AttackCondition {
  return interval
    ? new EveryNTurnsCondition(interval)
    : new AlwaysTrueAttackCondition();
}

function buildHitAlterations(dto: OtherSkillDto): HitAlterations | undefined {
  if (!dto.hitAlterations?.length) return undefined;

  return new HitAlterations(
    dto.hitAlterations.map((a) => ({
      polarity: a.polarity,
      type: mapAlterationType(a.type),
      rate: a.rate,
      duration: a.duration,
      terminationEvent: a.terminationEvent,
    })),
  );
}
