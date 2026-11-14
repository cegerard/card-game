import { FightingCard } from '../cards/fighting-card';
import {
  DECOY_STRUCK_TYPE,
  ENERGY_DRAINED_TYPE,
  EffectResult,
  SUPPORT_BLOCKED_TYPE,
  SUPPORT_BLOCK_ENDED_TYPE,
} from '../cards/@types/attack/attack-effect';
import {
  VULNERABILITY_EFFECT_TYPE,
  VULNERABILITY_ENDED_TYPE,
} from '../cards/@types/vulnerability/vulnerability';
import { MARK_EFFECT_TYPE } from '../cards/@types/mark/elemental-mark';
import {
  WEAK_POINT_EFFECT_TYPE,
  WEAK_POINT_ENDED_TYPE,
} from '../cards/@types/weak-point/weak-point';
import { Step, StepKind } from './@types/step';
import { status } from './@types/status-change-report';

/**
 * Maps the effects landed by one hit to their report steps: the effect itself
 * — an elemental mark and a weak point have their own step kinds, the status
 * effects share one — then the debuff it may have triggered, credited to the
 * attacker.
 *
 * Shared by `ActionStage` and `skillResultsToSteps()` so a reactive attack
 * reports its effects exactly like a regular one.
 */
export function effectResultsToSteps(
  attacker: FightingCard,
  effects: EffectResult[] = [],
): Step[] {
  return effects.flatMap((effect): Step[] => {
    switch (effect.type) {
      case WEAK_POINT_EFFECT_TYPE:
        return [
          {
            kind: StepKind.WeakPointRevealed,
            name: effect.weakPoint.name,
            source: effect.weakPoint.revealer.identityInfo,
            card: effect.card.identityInfo,
            ...(effect.weakPoint.remainingTurns !== undefined && {
              remainingTurns: effect.weakPoint.remainingTurns,
            }),
          },
        ];
      case WEAK_POINT_ENDED_TYPE:
        return [
          {
            kind: StepKind.WeakPointEnded,
            name: effect.name,
            card: effect.card.identityInfo,
            reason: effect.reason,
          },
        ];
      case ENERGY_DRAINED_TYPE:
        return [
          {
            kind: StepKind.EnergyDrained,
            card: effect.card.identityInfo,
            amount: effect.amount,
            energy: effect.energy,
          },
        ];
      case VULNERABILITY_EFFECT_TYPE:
        return [
          {
            kind: StepKind.VulnerabilityApplied,
            card: effect.card.identityInfo,
            damageType: effect.damageType,
            rate: effect.rate,
            remainingTurns: effect.remainingTurns,
          },
        ];
      case VULNERABILITY_ENDED_TYPE:
        return [
          {
            kind: StepKind.VulnerabilityEnded,
            card: effect.card.identityInfo,
            damageType: effect.damageType,
          },
        ];
      case SUPPORT_BLOCKED_TYPE:
        return [
          {
            kind: StepKind.SupportBlocked,
            card: effect.card.identityInfo,
            remainingTurns: effect.remainingTurns,
          },
        ];
      case SUPPORT_BLOCK_ENDED_TYPE:
        return [
          {
            kind: StepKind.SupportBlockEnded,
            card: effect.card.identityInfo,
          },
        ];
      case DECOY_STRUCK_TYPE:
        return [
          {
            kind: StepKind.DecoyStruck,
            name: effect.name,
            card: effect.card.identityInfo,
            remainingDecoys: effect.remainingDecoys,
          },
        ];
      case MARK_EFFECT_TYPE:
        return [
          {
            kind: StepKind.MarkApplied,
            card: effect.card.identityInfo,
            damageType: effect.damageType,
            stacks: effect.stacks,
          },
          ...triggeredDebuffSteps(attacker, effect),
        ];
      default:
        return [
          {
            kind: StepKind.StatusChange,
            status: effect.type as status,
            card: effect.card.identityInfo,
            ...(effect.stacks !== undefined && { stacks: effect.stacks }),
          },
          ...triggeredDebuffSteps(attacker, effect),
        ];
    }
  });
}

function triggeredDebuffSteps(
  attacker: FightingCard,
  effect: Extract<EffectResult, { triggeredDebuff?: unknown }>,
): Step[] {
  if (!effect.triggeredDebuff) return [];

  const { card: debuffTarget, debuff } = effect.triggeredDebuff;
  return [
    {
      kind: StepKind.Debuff,
      source: attacker.identityInfo,
      alterations: [
        {
          target: debuffTarget.identityInfo,
          kind: debuff.type,
          value: debuff.value,
          remainingTurns: debuff.duration,
        },
      ],
      energy: attacker.actualEnergy,
    },
  ];
}
