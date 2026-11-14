import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackResult } from '../@types/action-result/attack-result';
import { SpecialResult } from '../@types/action-result/special-result';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { Trigger } from '../../trigger/trigger';
import { AttackSkillResults, Skill, SkillKind, SkillResults } from './skill';

/**
 * Casts its owner attack special once more when its event fires: meant for
 * `self-death` under a stance, an echo of the caster lingering after it fell.
 * Everything the special does is reported like a reactive attack: hits,
 * effects, executions, battlefield, stance, and its alterations and shield as
 * follow-ups. The gauge is never touched, so an energy refund has nothing to
 * refund.
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
      stanceStarted: special.stanceStarted,
      followUps: sideResults(special),
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}

/** The alterations and shield of the special, reported after its hits. */
function sideResults({
  name,
  alterationResults,
  shieldResults,
}: SpecialResult): SkillResults[] {
  return [
    {
      skillKind: SkillKind.Buff,
      name,
      results: alterationResults.filter(
        (r): r is BuffResult => r.alteration.polarity === 'buff',
      ),
    },
    {
      skillKind: SkillKind.Debuff,
      name,
      results: alterationResults.filter(
        (r): r is DebuffResult => r.alteration.polarity === 'debuff',
      ),
    },
    { skillKind: SkillKind.Shield, name, results: shieldResults },
  ];
}
