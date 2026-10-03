import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackCondition } from '../@types/attack/attack-condition';
import { AttackSkill } from './attack-skill';
import { Skill, SkillKind, SkillResults } from './skill';
import { Trigger } from '../../trigger/trigger';
import { isActivatableTrigger } from '../../trigger/activatable-trigger';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export class ConditionalAttack implements Skill {
  public id = 'conditional-attack';

  constructor(
    public readonly name: string,
    private readonly attackSkill: AttackSkill,
    private readonly condition: AttackCondition,
    private readonly trigger: Trigger,
    private readonly powerId?: string,
    public readonly requiredStance?: string,
    private readonly energyCost?: number,
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
    if (this.energyCost && source.actualEnergy < this.energyCost) {
      return { skillKind: SkillKind.Attack, results: [], name: this.name };
    }

    const attackResults = this.attackSkill.launch(
      source,
      context,
      targetingStrategy,
    );
    this.condition.reset();
    // An attack that found nobody to strike costs nothing.
    if (this.energyCost && attackResults.results.length > 0) {
      source.spendEnergy(this.energyCost);
    }

    return {
      skillKind: SkillKind.Attack,
      results: attackResults.results,
      name: this.name,
      powerId: this.powerId,
    };
  }

  activate(triggerId: string, context: FightingContext): void {
    if (isActivatableTrigger(this.trigger)) {
      this.trigger.activate(triggerId, context);
    }
  }

  tick(): void {
    this.condition.tick();
  }
}
