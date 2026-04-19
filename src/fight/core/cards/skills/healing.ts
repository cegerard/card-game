import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Skill, SkillKind, SkillResults } from './skill';
import { Trigger } from '../../trigger/trigger';
import { ActivatableTrigger } from '../../trigger/activatable-trigger';
import { FightingContext } from '../@types/fighting-context';

export class Healing implements Skill {
  public id = 'healing-skill';

  private readonly effectRate: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;
  private readonly powerId?: string;

  constructor(
    effectRate: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
    powerId?: string,
  ) {
    this.effectRate = effectRate;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
    this.powerId = powerId;
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): SkillResults {
    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const healingResults = targetedCards.map((targetedCard) => {
      return {
        target: targetedCard.identityInfo,
        healAmount: targetedCard.heal(source.actualAttack * this.effectRate),
        remainingHealth: targetedCard.actualHealth,
      };
    });

    return {
      skillKind: SkillKind.Healing,
      results: healingResults,
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
