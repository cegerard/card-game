import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { Trigger } from '../../trigger/trigger';
import { Skill, SkillKind, SkillResults } from './skill';
import { assertConcealmentDuration } from './concealment-duration';

/**
 * Conceals its owner when its event fires: no enemy can target it until it
 * attacks or, when a duration is given, until that duration runs out.
 */
export class ConcealmentSkill implements Skill {
  public readonly id = 'concealment-skill';

  constructor(
    public readonly name: string,
    private readonly trigger: Trigger,
    private readonly duration?: number,
    public readonly powerId?: string,
  ) {
    assertConcealmentDuration(duration);
  }

  launch(source: FightingCard, _context: FightingContext): SkillResults {
    return {
      skillKind: SkillKind.Concealment,
      name: this.name,
      concealment: source.conceal(this.name, this.duration),
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
