import { SkillKind } from '@card-game/shared-types';
import { OtherSkillDto } from './dto/fight-data.dto';
import { Skill } from '../core/cards/skills/skill';
import { Randomizer } from '../core/randomizer';
import { OtherSkillOf } from './skill-kind-fields';
import {
  buildAffliction,
  buildAftershock,
  buildAnalysis,
  buildBleedExplosion,
  buildConditionalAttack,
  buildRealDamage,
  buildSpecialEcho,
  buildWeakPointLegacy,
} from './offensive-skill-factory';
import {
  buildAlteration,
  buildBuffTransfer,
  buildEnergyGain,
  buildHealing,
  buildSupport,
} from './supportive-skill-factory';
import {
  buildConcealment,
  buildProtection,
  buildShield,
  buildStance,
  buildTargetingOverride,
  buildTransformation,
} from './posture-skill-factory';

type SkillBuilder<K extends SkillKind> = (
  skillData: OtherSkillOf<K>,
  ownerId: string,
  randomizer: Randomizer,
) => Skill;

/**
 * One builder per skill kind, which sees only the fields of its kind. A
 * card-bound passive has none: `fighting-card-factory.ts` takes it out of
 * `others` and keeps it on the card.
 */
const BUILDERS: { [K in SkillKind]: SkillBuilder<K> | null } = {
  [SkillKind.HEALING]: buildHealing,
  [SkillKind.ALTERATION]: buildAlteration,
  [SkillKind.SUPPORT]: buildSupport,
  [SkillKind.BUFF_TRANSFER]: buildBuffTransfer,
  [SkillKind.ENERGY_GAIN]: buildEnergyGain,
  [SkillKind.CONDITIONAL_ATTACK]: buildConditionalAttack,
  [SkillKind.AFTERSHOCK]: buildAftershock,
  [SkillKind.BLEED_DETONATION]: buildBleedExplosion,
  [SkillKind.REAL_DAMAGE]: buildRealDamage,
  [SkillKind.SPECIAL_ECHO]: buildSpecialEcho,
  [SkillKind.AFFLICTION]: buildAffliction,
  [SkillKind.ANALYSIS]: buildAnalysis,
  [SkillKind.WEAK_POINT_LEGACY]: buildWeakPointLegacy,
  [SkillKind.SHIELD]: buildShield,
  [SkillKind.PROTECTION]: buildProtection,
  [SkillKind.STANCE]: buildStance,
  [SkillKind.CONCEALMENT]: buildConcealment,
  [SkillKind.TRANSFORMATION]: buildTransformation,
  [SkillKind.TARGETING_OVERRIDE]: buildTargetingOverride,
  [SkillKind.SURVIVE]: null,
  [SkillKind.DAMAGE_REDUCTION]: null,
  [SkillKind.DODGE_BONUS_DENIAL]: null,
  [SkillKind.BLEED_STACK_SCALING]: null,
  [SkillKind.BLEED_EMPOWERMENT]: null,
  [SkillKind.LOW_HEALTH_TARGET_BONUS]: null,
  [SkillKind.POISONED_ENEMY_AGILITY]: null,
  [SkillKind.ATTACKER_INSIGHT]: null,
};

/** Builds an OTHER skill whose fields `rejectMisplacedFields()` checked. */
export function createOtherSkill(
  skillData: OtherSkillDto,
  ownerId: string,
  randomizer: Randomizer,
): Skill {
  const build = BUILDERS[skillData.kind] as
    SkillBuilder<SkillKind> | null | undefined;
  if (build === undefined) {
    throw new Error(`Unknown skill kind: ${skillData.kind}`);
  }
  if (build === null) {
    throw new Error(
      `${skillData.kind} skill must not appear in others skill list`,
    );
  }

  return build(skillData, ownerId, randomizer);
}
