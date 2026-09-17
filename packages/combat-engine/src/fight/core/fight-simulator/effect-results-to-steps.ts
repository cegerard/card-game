import { FightingCard } from '../cards/fighting-card';
import { EffectResult } from '../cards/@types/attack/attack-effect';
import { MARK_EFFECT_TYPE } from '../cards/@types/mark/elemental-mark';
import { Step, StepKind } from './@types/step';
import { status } from './@types/status-change-report';

/**
 * Maps the effects landed by one hit to their report steps: the effect itself
 * — an elemental mark has its own step kind, the status effects share one —
 * then the debuff it may have triggered, credited to the attacker.
 *
 * Shared by `ActionStage` and `skillResultsToSteps()` so a reactive attack
 * reports its effects exactly like a regular one.
 */
export function effectResultsToSteps(
  attacker: FightingCard,
  effects: EffectResult[] = [],
): Step[] {
  return effects.flatMap((effect): Step[] => {
    const steps: Step[] = [
      effect.type === MARK_EFFECT_TYPE
        ? {
            kind: StepKind.MarkApplied,
            card: effect.card.identityInfo,
            damageType: effect.damageType,
            stacks: effect.stacks,
          }
        : {
            kind: StepKind.StatusChange,
            status: effect.type as status,
            card: effect.card.identityInfo,
          },
    ];

    if (effect.triggeredDebuff) {
      const { card: debuffTarget, debuff } = effect.triggeredDebuff;
      steps.push({
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
      });
    }

    return steps;
  });
}
