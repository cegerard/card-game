import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { WEAK_POINT_EFFECT_TYPE } from '../@types/weak-point/weak-point';
import { Trigger } from '../../trigger/trigger';
import { AfflictionSkillResults, Skill, SkillKind } from './skill';

/**
 * Makes every weak point its owner revealed on the living enemies permanent,
 * and amplifies the hits they take through it by `1 + damageRate`. Meant for
 * `self-death`: what the revealer saw outlives it. Reported as the weak
 * points revealed again, without a duration.
 */
export class WeakPointLegacySkill implements Skill {
  public readonly id = 'weak-point-legacy';

  constructor(
    public readonly name: string,
    private readonly damageRate: number,
    private readonly trigger: Trigger,
    public readonly requiredStance?: string,
  ) {
    if (damageRate <= 0) {
      throw new Error(
        `WeakPointLegacySkill rate must be greater than 0, got ${damageRate}`,
      );
    }
  }

  launch(
    source: FightingCard,
    context: FightingContext,
  ): AfflictionSkillResults {
    return {
      skillKind: SkillKind.Affliction,
      name: this.name,
      results: context.opponentPlayer.playableCards.flatMap((card) =>
        card.persistWeakPointsOf(source, this.damageRate).map((weakPoint) => ({
          type: WEAK_POINT_EFFECT_TYPE,
          card,
          weakPoint,
        })),
      ),
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
