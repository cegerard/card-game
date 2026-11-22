import { BadRequestException } from '@nestjs/common';
import { SkillKind } from '@card-game/shared-types';
import { OtherSkillDto } from './dto/fight-data.dto';

/**
 * The fields of an OTHER skill only some kinds may carry, with those kinds.
 * Any other kind carrying one gets a 400. A field missing here is common to
 * every kind. The order is the order the 400 lists them in.
 */
const RESERVED_FIELDS = {
  extraStacks: [SkillKind.BLEED_EMPOWERMENT],
  triggeredDebuff: [SkillKind.BLEED_EMPOWERMENT],
  basis: [SkillKind.BLEED_EMPOWERMENT, SkillKind.REAL_DAMAGE],
  stanceActivations: [SkillKind.TRANSFORMATION],
  poisonSurge: [SkillKind.TRANSFORMATION],
  criticalDamageRate: [SkillKind.TRANSFORMATION],
  battlefield: [SkillKind.TRANSFORMATION],
  activationEventThreshold: [SkillKind.TRANSFORMATION],
  perLivingAlly: [SkillKind.ALTERATION],
  whileHealthBelow: [SkillKind.ALTERATION],
  whileShielded: [SkillKind.ALTERATION],
  terminationDamageRate: [SkillKind.ALTERATION],
  shield: [SkillKind.SUPPORT],
  cleanse: [SkillKind.SUPPORT],
  alterations: [SkillKind.SUPPORT],
  accuracyRate: [SkillKind.ATTACKER_INSIGHT],
  agilityRate: [SkillKind.ATTACKER_INSIGHT],
  amount: [SkillKind.ENERGY_GAIN],
  hitAlterations: [SkillKind.CONDITIONAL_ATTACK],
  endsStance: [SkillKind.CONDITIONAL_ATTACK],
  execution: [SkillKind.CONDITIONAL_ATTACK],
  weakPointPenetration: [SkillKind.CONDITIONAL_ATTACK],
  requiresUndamaged: [SkillKind.CONDITIONAL_ATTACK, SkillKind.CONCEALMENT],
  interval: [
    SkillKind.CONDITIONAL_ATTACK,
    SkillKind.CONCEALMENT,
    SkillKind.SUPPORT,
  ],
  energyCost: [SkillKind.CONDITIONAL_ATTACK, SkillKind.SUPPORT],
  rampingChance: [SkillKind.STANCE],
} as const satisfies Partial<Record<keyof OtherSkillDto, readonly SkillKind[]>>;

type ReservedField = keyof typeof RESERVED_FIELDS;

type FieldsReservedTo<K extends SkillKind> = {
  [F in ReservedField]: K extends (typeof RESERVED_FIELDS)[F][number]
    ? F
    : never;
}[ReservedField];

/**
 * An OTHER skill of kind K as its builder sees it: the common fields and the
 * fields reserved to K, never those reserved to another kind (the 400 of
 * `rejectMisplacedFields()` guarantees they are absent).
 */
export type OtherSkillOf<K extends SkillKind> = Omit<
  OtherSkillDto,
  'kind' | Exclude<ReservedField, FieldsReservedTo<K>>
> & { kind: K };

/** Refuses a skill carrying a field reserved to other kinds. */
export function rejectMisplacedFields(others: OtherSkillDto[]): void {
  for (const skill of others) {
    const misplaced = (
      Object.entries(RESERVED_FIELDS) as [ReservedField, readonly SkillKind[]][]
    )
      .filter(
        ([field, kinds]) =>
          !kinds.includes(skill.kind) && skill[field] !== undefined,
      )
      .map(([field]) => field);
    if (misplaced.length > 0) {
      throw new BadRequestException(
        `${skill.kind} skill cannot carry: ${misplaced.join(', ')}`,
      );
    }
  }
}
