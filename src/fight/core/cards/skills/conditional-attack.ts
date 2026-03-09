import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackCondition } from '../@types/attack/attack-condition';
import { SimpleAttack } from './simple-attack';
import { Skill, SkillKind, SkillResults } from './skill';

export class ConditionalAttack implements Skill {
  public id = 'conditional-attack';

  constructor(
    private readonly simpleAttack: SimpleAttack,
    private readonly condition: AttackCondition,
  ) {}

  isTriggered(triggerName: string): boolean {
    return triggerName === 'next-action' && this.condition.isTriggered();
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
    const results = this.simpleAttack.launch(source, context);
    this.condition.reset();
    return { skillKind: SkillKind.Attack, results };
  }

  tick(): void {
    this.condition.tick();
  }
}
