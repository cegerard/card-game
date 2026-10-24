import { BadRequestException } from '@nestjs/common';
import {
  FightingCardDto,
  OtherSkillDto,
  SkillKind,
  ElementDto,
} from './dto/fight-data.dto';
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
  buildSurviveSkill,
} from './card-bound-skill-factory';

// Fields that only some skill kinds can carry
const KIND_ONLY_FIELDS: {
  kinds: SkillKind[];
  fields: (keyof OtherSkillDto)[];
}[] = [
  {
    kinds: [SkillKind.BLEED_EMPOWERMENT],
    fields: ['extraStacks', 'basis', 'triggeredDebuff'],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK],
    fields: ['hitAlterations', 'endsStance', 'execution'],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK, SkillKind.CONCEALMENT],
    fields: ['requiresUndamaged', 'interval'],
  },
];

const CARD_BOUND_SKILL_KINDS = [
  SkillKind.SURVIVE,
  SkillKind.DAMAGE_REDUCTION,
  SkillKind.DODGE_BONUS_DENIAL,
  SkillKind.BLEED_STACK_SCALING,
  SkillKind.BLEED_EMPOWERMENT,
  SkillKind.LOW_HEALTH_TARGET_BONUS,
];

export function buildFightingCard(cardData: FightingCardDto): FightingCard {
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
    },
    {
      dodge: buildDodgeStrategy(cardData.behaviors.dodge),
    },
    new MathRandomizer(),
    mapElement(cardData.element),
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

/**
 * Maps the DTO element onto its domain counterpart. The two enums carry the
 * same string values, but going through an explicit map keeps an unknown
 * element loud instead of silently reaching the elemental matrix.
 */
function mapElement(element?: ElementDto): Element {
  if (element === undefined) return Element.PHYSICAL;

  const ELEMENT_MAP: Record<ElementDto, Element> = {
    [ElementDto.PHYSICAL]: Element.PHYSICAL,
    [ElementDto.FIRE]: Element.FIRE,
    [ElementDto.WATER]: Element.WATER,
    [ElementDto.EARTH]: Element.EARTH,
    [ElementDto.AIR]: Element.AIR,
  };

  const result = ELEMENT_MAP[element];
  if (!result) throw new Error(`Unknown element: ${element}`);
  return result;
}
