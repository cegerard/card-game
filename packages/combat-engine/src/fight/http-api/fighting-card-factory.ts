import { BadRequestException } from '@nestjs/common';
import {
  FightingCardDto,
  OtherSkillDto,
  SkillKind,
  SpecialKind,
} from './dto/fight-data.dto';
import { mapElement } from './skill-wiring-factory';
import { FightingCard } from '../core/cards/fighting-card';
import { buildDodgeStrategy } from './dodge-strategy-factory';
import { Element } from '../core/cards/@types/damage/element';
import { MathRandomizer } from '../tools/math-randomizer';
import { Skill } from '../core/cards/skills/skill';
import { validatePowerIdConsistency } from '../core/cards/skills/power-id-consistency';
import { buildSpecial } from './special-factory';
import { buildAttackSkill } from './attack-skill-factory';
import { createOtherSkill } from './other-skill-factory';
import {
  buildBleedEmpowerment,
  buildBleedStackScalingSkill,
  buildDamageReduction,
  buildDodgeBonusDenialSkill,
  buildLowHealthTargetBonus,
  buildPoisonedEnemyAgility,
  buildAttackerInsight,
  buildSurviveSkill,
} from './card-bound-skill-factory';

// Fields that only some skill kinds can carry
const KIND_ONLY_FIELDS: {
  kinds: SkillKind[];
  fields: (keyof OtherSkillDto)[];
}[] = [
  {
    kinds: [SkillKind.BLEED_EMPOWERMENT],
    fields: ['extraStacks', 'triggeredDebuff'],
  },
  {
    kinds: [SkillKind.BLEED_EMPOWERMENT, SkillKind.REAL_DAMAGE],
    fields: ['basis'],
  },
  {
    kinds: [SkillKind.TRANSFORMATION],
    fields: [
      'stanceActivations',
      'poisonSurge',
      'criticalDamageRate',
      'battlefield',
      'activationEventThreshold',
    ],
  },
  {
    kinds: [SkillKind.ALTERATION],
    fields: ['perLivingAlly', 'whileHealthBelow', 'terminationDamageRate'],
  },
  {
    kinds: [SkillKind.SUPPORT],
    fields: ['shield', 'cleanse', 'alterations'],
  },
  {
    kinds: [SkillKind.ATTACKER_INSIGHT],
    fields: ['accuracyRate', 'agilityRate'],
  },
  {
    kinds: [SkillKind.ENERGY_GAIN],
    fields: ['amount'],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK],
    fields: [
      'hitAlterations',
      'endsStance',
      'execution',
      'weakPointPenetration',
    ],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK, SkillKind.CONCEALMENT],
    fields: ['requiresUndamaged'],
  },
  {
    kinds: [
      SkillKind.CONDITIONAL_ATTACK,
      SkillKind.CONCEALMENT,
      SkillKind.SUPPORT,
    ],
    fields: ['interval'],
  },
  {
    kinds: [SkillKind.STANCE],
    fields: ['rampingChance'],
  },
];

const CARD_BOUND_SKILL_KINDS = [
  SkillKind.SURVIVE,
  SkillKind.DAMAGE_REDUCTION,
  SkillKind.DODGE_BONUS_DENIAL,
  SkillKind.BLEED_STACK_SCALING,
  SkillKind.BLEED_EMPOWERMENT,
  SkillKind.LOW_HEALTH_TARGET_BONUS,
  SkillKind.POISONED_ENEMY_AGILITY,
  SkillKind.ATTACKER_INSIGHT,
];

export function buildFightingCard(cardData: FightingCardDto): FightingCard {
  if (
    cardData.skills.others.some((s) => s.kind === SkillKind.SPECIAL_ECHO) &&
    cardData.skills.special.kind !== SpecialKind.ATTACK
  ) {
    throw new BadRequestException(
      'SPECIAL_ECHO can only echo an ATTACK special',
    );
  }
  const special = buildSpecial(cardData.skills.special);
  const attackSkill = buildAttackSkill(cardData.skills);

  const { others } = cardData.skills;
  const surviveSkill = buildSurviveSkill(others);
  const damageReduction = buildDamageReduction(others);
  const dodgeBonusDenial = buildDodgeBonusDenialSkill(others);
  const bleedStackScaling = buildBleedStackScalingSkill(others);
  rejectMisplacedKindOnlyFields(others);
  const bleedEmpowerment = buildBleedEmpowerment(others);
  const lowHealthTargetBonus = buildLowHealthTargetBonus(others);
  const poisonedEnemyAgility = buildPoisonedEnemyAgility(others);
  const attackerInsight = buildAttackerInsight(others);

  // The CARD_BOUND_SKILL_KINDS carry no trigger and no
  // targeting: they live on the card itself and are consulted when a hit is
  // resolved, so they are pulled out before the regular skill loop.
  const triggeredOthers = others.filter(
    (s) => !CARD_BOUND_SKILL_KINDS.includes(s.kind),
  );

  try {
    validatePowerIdConsistency(
      triggeredOthers
        .filter((s) => s.event !== undefined)
        .map((s) => ({
          powerId: s.powerId,
          event: s.event as string,
          terminationEvent: s.terminationEvent,
        })),
    );
  } catch (e) {
    throw new BadRequestException((e as Error).message);
  }

  const otherSkills: Skill[] = triggeredOthers.map((skill) =>
    createOtherSkill(skill, cardData.id),
  );

  return new FightingCard(
    cardData.id,
    cardData.name,
    cardData,
    {
      special,
      simpleAttack: attackSkill,
      others: otherSkills,
      survive: surviveSkill,
      damageReduction,
      dodgeBonusDenial,
      bleedStackScaling,
      bleedEmpowerment,
      lowHealthTargetBonus,
      poisonedEnemyAgility,
      attackerInsight,
    },
    {
      dodge: buildDodgeStrategy(cardData.behaviors.dodge),
    },
    new MathRandomizer(),
    cardData.element === undefined
      ? Element.PHYSICAL
      : mapElement(cardData.element),
  );
}

function rejectMisplacedKindOnlyFields(others: OtherSkillDto[]): void {
  for (const skill of others) {
    const misplaced = KIND_ONLY_FIELDS.filter(
      ({ kinds }) => !kinds.includes(skill.kind),
    )
      .flatMap(({ fields }) => fields)
      .filter((field) => skill[field] !== undefined);
    if (misplaced.length > 0) {
      throw new BadRequestException(
        `${skill.kind} skill cannot carry: ${misplaced.join(', ')}`,
      );
    }
  }
}
