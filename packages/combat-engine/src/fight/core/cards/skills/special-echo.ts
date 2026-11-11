import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';
import { Trigger } from '../../trigger/trigger';
import { AttackSkillResults, Skill, SkillKind } from './skill';

/**
 * Casts its owner attack special once more when its event fires, without
 * touching the gauge: meant for `self-death` under a stance, an echo of the
 * caster lingering after it fell. Its hits, effects, executions and
 * battlefield are reported like a reactive attack; the special own
 * alterations, shield and stance are not.
 */
export class SpecialEchoSkill implements Skill {
  public readonly id = 'special-echo';

  constructor(
    public readonly name: string,
    private readonly trigger: Trigger,
    public readonly requiredStance?: string,
  ) {}

  launch(source: FightingCard, context: FightingContext): AttackSkillResults {
    const special = source.echoSpecial(context);
    const executions = special.executions ?? [];

    return {
      skillKind: SkillKind.Attack,
      name: special.name,
      results: special.actionResults as AttackResult[],
      executions:
        executions.length > 0
          ? { name: special.name, results: executions }
          : undefined,
      battlefield: special.battlefield,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
