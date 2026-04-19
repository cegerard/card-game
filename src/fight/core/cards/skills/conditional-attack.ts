import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AttackSkill } from './attack-skill';
import { Skill, SkillKind, SkillResults } from './skill';
import { Trigger } from '../../trigger/trigger';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export class ConditionalAttack implements Skill {
  public id = 'conditional-attack';

  constructor(
    private readonly attackSkill: AttackSkill,
    private readonly condition: AttackCondition,
    private readonly trigger: Trigger,
  ) {}

  isTriggered(triggerName: string): boolean {
    return (
      this.trigger.isTriggered(triggerName) && this.condition.isTriggered()
    );
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SkillResults {
    const results = this.attackSkill.launch(source, context, targetingStrategy);
    this.condition.reset();
    return { skillKind: SkillKind.Attack, results };
  }

  tick(): void {
    this.condition.tick();
  }
}
