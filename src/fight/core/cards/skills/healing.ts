import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { HealingResults } from '../@types/action-result/healing-results';
import { FightingCard } from '../fighting-card';
import { Skill } from './skill';
import { Trigger } from '../../trigger/trigger';
import { FightingContext } from '../@types/fighting-context';

export class Healing implements Skill {
  private readonly effectRate: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;

  constructor(
    effectRate: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
  ) {
    this.effectRate = effectRate;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
  }

  launch(source: FightingCard, context: FightingContext): HealingResults {
    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return targetedCards.map((targetedCard) => {
      return {
        target: targetedCard.identityInfo,
        healAmount: targetedCard.heal(source.actualAttack * this.effectRate),
        remainingHealth: targetedCard.actualHealth,
      };
    });
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
