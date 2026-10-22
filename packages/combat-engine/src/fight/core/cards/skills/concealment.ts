import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { Trigger } from '../../trigger/trigger';
import { Skill, SkillKind, SkillResults } from './skill';
import { assertConcealmentDuration } from './concealment-duration';
import { StanceActivation } from '../@types/stance/stance';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AlwaysTrueAttackCondition } from '../@types/attack/conditions/always-true-attack-condition';

/**
 * Conceals its owner when its event fires: no enemy can target it until it
 * attacks or, when a duration is given, until that duration runs out.
 *
 * It can also open a stance on its owner — a dive underground that a skill
 * requiring that stance turns into a strike — and wait for a cooldown
 * (`condition`), restarted each time it fires.
 */
export class ConcealmentSkill implements Skill {
  public readonly id = 'concealment-skill';

  constructor(
    public readonly name: string,
    private readonly trigger: Trigger,
    private readonly duration?: number,
    public readonly powerId?: string,
    private readonly stanceActivation?: StanceActivation,
    private readonly condition: AttackCondition = new AlwaysTrueAttackCondition(),
    public readonly requiresUndamaged?: boolean,
  ) {
    assertConcealmentDuration(duration);
  }

  launch(source: FightingCard, _context: FightingContext): SkillResults {
    this.condition.reset();

    return {
      skillKind: SkillKind.Concealment,
      name: this.name,
      concealment: source.conceal(this.name, this.duration),
      stanceStarted: this.stanceActivation
        ? source.activateStance(this.stanceActivation)
        : undefined,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return (
      this.trigger.isTriggered(triggerName) && this.condition.isTriggered()
    );
  }

  tick(): void {
    this.condition.tick();
  }
}
