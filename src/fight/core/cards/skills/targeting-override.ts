import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
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
  ) {}

  launch(source: FightingCard, _context: FightingContext): SkillResults {
    const previousStrategy = source.attackTargetingId;

    source.overrideAttackTargeting(
      this.targetingStrategy,
      this.terminationEvent,
      this.powerId,
    );

    const report: TargetingOverrideReport = {
      kind: StepKind.TargetingOverride,
      source: source.identityInfo,
      previousStrategy,
      newStrategy: this.targetingStrategy.id,
      powerId: this.powerId,
    };

    return {
      skillKind: SkillKind.TargetingOverride,
      results: [report] as any,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
