import { BadRequestException } from '@nestjs/common';
import { RateBasis, SkillKind } from '@card-game/shared-types';
import { Randomizer } from '../core/randomizer';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { BleedDetonation } from '../core/cards/@types/attack/bleed-detonation';
import { LowHealthDebuff } from '../core/cards/@types/attack/low-health-debuff';
import { Splash } from '../core/cards/@types/attack/splash';
import { AttackSkill } from '../core/cards/skills/attack-skill';
import { ConditionalAttack } from '../core/cards/skills/conditional-attack';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { AftershockSkill } from '../core/cards/skills/aftershock';
import { BleedExplosionSkill } from '../core/cards/skills/bleed-explosion';
import { RealDamageSkill } from '../core/cards/skills/real-damage';
import { SpecialEchoSkill } from '../core/cards/skills/special-echo';
import { AfflictionSkill } from '../core/cards/skills/affliction';
import { AnalysisSkill } from '../core/cards/skills/analysis';
import { WeakPointLegacySkill } from '../core/cards/skills/weak-point-legacy';
import { buildEffect, buildEffects } from './attack-effect-factory';
import { buildExecution } from './attack-skill-factory';
import { OtherSkillOf } from './skill-kind-fields';
import {
  asBadRequest,
  buildCooldown,
  buildHitAlterations,
  buildSkillTargeting,
  buildTriggerForSkill,
  requireBuffType,
} from './skill-wiring-factory';

/*
 * The OTHER skills that strike or afflict: event-triggered attacks and the
 * skills laying damage, effects or weak points without the attack path.
 */

export function buildConditionalAttack(
  skillData: OtherSkillOf<typeof SkillKind.CONDITIONAL_ATTACK>,
  ownerId: string,
  randomizer: Randomizer,
): ConditionalAttack {
  const attackSkill = buildConditionalAttackSkill(skillData, randomizer);
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
                buildEffects(skillData.splash.effects, randomizer),
              )
            : undefined,
          lowHealthDebuff: skillData.onLowHealthAfterHit
            ? new LowHealthDebuff(
                skillData.onLowHealthAfterHit.name,
                skillData.onLowHealthAfterHit.threshold,
                skillData.onLowHealthAfterHit.debuffs.map((debuff) => ({
                  type: requireBuffType(debuff.type),
                  rate: debuff.rate,
                  duration: debuff.duration,
                })),
              )
            : undefined,
          stanceActivation: skillData.stanceActivation,
          requiresUndamaged: skillData.requiresUndamaged,
          hitAlterations: buildHitAlterations(skillData.hitAlterations),
          endsStance: skillData.endsStance,
          execution: buildExecution(skillData.execution),
          activationLimit: skillData.activationLimit,
          endEvent: skillData.endEvent,
        },
      ),
  );
}

export function buildAftershock(
  skillData: OtherSkillOf<typeof SkillKind.AFTERSHOCK>,
  ownerId: string,
  randomizer: Randomizer,
): AftershockSkill {
  return new AftershockSkill(
    skillData.name,
    new Splash(
      skillData.name,
      buildDamages(skillData),
      skillData.effect
        ? [buildEffect(skillData.effect, randomizer)]
        : undefined,
      false,
    ),
    buildTriggerForSkill(skillData, ownerId),
    skillData.requiresStance,
  );
}

export function buildBleedExplosion(
  skillData: OtherSkillOf<typeof SkillKind.BLEED_DETONATION>,
  ownerId: string,
): BleedExplosionSkill {
  return new BleedExplosionSkill(
    skillData.name,
    skillData.rate,
    buildTriggerForSkill(skillData, ownerId),
    skillData.requiresStance,
  );
}

export function buildRealDamage(
  skillData: OtherSkillOf<typeof SkillKind.REAL_DAMAGE>,
  ownerId: string,
): RealDamageSkill {
  return asBadRequest(
    () =>
      new RealDamageSkill(
        skillData.name,
        skillData.rate,
        skillData.basis ?? RateBasis.SOURCE_ATTACK,
        buildTriggerForSkill(skillData, ownerId),
        buildSkillTargeting(skillData),
        skillData.requiresStance,
      ),
  );
}

export function buildSpecialEcho(
  skillData: OtherSkillOf<typeof SkillKind.SPECIAL_ECHO>,
  ownerId: string,
): SpecialEchoSkill {
  return new SpecialEchoSkill(
    skillData.name,
    buildTriggerForSkill(skillData, ownerId),
    skillData.requiresStance,
  );
}

export function buildAffliction(
  skillData: OtherSkillOf<typeof SkillKind.AFFLICTION>,
  ownerId: string,
  randomizer: Randomizer,
): AfflictionSkill {
  return new AfflictionSkill(
    skillData.name,
    buildEffect(skillData.effect, randomizer),
    buildTriggerForSkill(skillData, ownerId),
    buildSkillTargeting(skillData),
    skillData.requiresStance,
  );
}

export function buildAnalysis(
  skillData: OtherSkillOf<typeof SkillKind.ANALYSIS>,
  ownerId: string,
  randomizer: Randomizer,
): AnalysisSkill {
  return asBadRequest(
    () =>
      new AnalysisSkill(
        skillData.name,
        skillData.maxStacks,
        buildEffect(skillData.effect, randomizer),
        buildTriggerForSkill(skillData, ownerId),
      ),
  );
}

export function buildWeakPointLegacy(
  skillData: OtherSkillOf<typeof SkillKind.WEAK_POINT_LEGACY>,
  ownerId: string,
): WeakPointLegacySkill {
  return asBadRequest(
    () =>
      new WeakPointLegacySkill(
        skillData.name,
        skillData.rate,
        buildTriggerForSkill(skillData, ownerId),
        skillData.requiresStance,
      ),
  );
}

function buildConditionalAttackSkill(
  skillData: OtherSkillOf<typeof SkillKind.CONDITIONAL_ATTACK>,
  randomizer: Randomizer,
): AttackSkill {
  if (skillData.bleedDetonation && skillData.hits) {
    throw new BadRequestException(
      'CONDITIONAL_ATTACK bleedDetonation cannot be combined with hits',
    );
  }
  const caDamages = buildDamages(skillData);
  const caEffects = skillData.effect
    ? [buildEffect(skillData.effect, randomizer)]
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
        buildEffects(skillData.comboFinisherEffects, randomizer),
        undefined,
        skillData.defensePenetration,
        skillData.weakPointPenetration,
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
        skillData.weakPointPenetration,
      );
}

function buildDamages(
  skillData: Pick<OtherSkillOf<SkillKind>, 'damages'>,
): DamageComposition[] {
  return (skillData.damages ?? []).map(
    (d) => new DamageComposition(d.type, d.rate),
  );
}
