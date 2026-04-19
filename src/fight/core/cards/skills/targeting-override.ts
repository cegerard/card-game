import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { ActivatableTrigger } from '../../trigger/activatable-trigger';
import { FightingContext } from '../@types/fighting-context';
import { Skill, SkillKind, SkillResults } from './skill';
import { TargetingOverrideReport } from '../../fight-simulator/@types/targeting-override-report';
import { StepKind } from '../../fight-simulator/@types/step';

export class TargetingOverrideSkill implements Skill {
  public id = 'targeting-override';

  constructor(
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly terminationEvent: string,
    private readonly trigger: Trigger,
    private readonly powerId?: string,
    private readonly strategyResolver?: (
      context: FightingContext,
    ) => TargetingCardStrategy,
  ) {}

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): SkillResults {
    const previousStrategy = source.attackTargetingId;

    const strategy = this.strategyResolver
      ? this.strategyResolver(context)
      : this.targetingStrategy;

    if (!strategy) {
      return {
        skillKind: SkillKind.TargetingOverride,
        results: [],
        powerId: this.powerId,
      };
    }

    source.overrideAttackTargeting(
      strategy,
      this.terminationEvent,
      this.powerId,
    );

    const report: TargetingOverrideReport = {
      kind: StepKind.TargetingOverride,
      source: source.identityInfo,
      previousStrategy,
      newStrategy: strategy.id,
      powerId: this.powerId,
    };

    return {
      skillKind: SkillKind.TargetingOverride,
      results: [report],
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }

  activate(triggerId: string, context: FightingContext): void {
    if ('activate' in this.trigger) {
      (this.trigger as ActivatableTrigger).activate(triggerId, context);
    }
  }
}
