import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Skill, SkillKind, SkillResults } from './skill';
import { Trigger } from '../../trigger/trigger';
import { ActivatableTrigger } from '../../trigger/activatable-trigger';
import { FightingContext } from '../@types/fighting-context';

export class Healing implements Skill {
  public id = 'healing-skill';

  public readonly name: string;
  private readonly effectRate: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;
  private readonly powerId?: string;
  private readonly activationLimit?: number;
  private readonly endEvent?: string;
  private activationCount = 0;

  constructor(
    name: string,
    effectRate: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
    powerId?: string,
    activationLimit?: number,
    endEvent?: string,
  ) {
    this.name = name;
    this.effectRate = effectRate;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
    this.powerId = powerId;
    this.activationLimit = activationLimit;
    this.endEvent = endEvent;
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

    this.activationCount++;
    const isExhausted =
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit;
    const endEvent = isExhausted ? this.endEvent : undefined;

    const healingResults = targetedCards.map((targetedCard) => ({
      target: targetedCard.identityInfo,
      healAmount: targetedCard.heal(source.actualAttack * this.effectRate),
      remainingHealth: targetedCard.actualHealth,
    }));

    return {
      skillKind: SkillKind.Healing,
      results: healingResults,
      name: this.name,
      endEvent,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    if (this.isExhaustedCheck()) return false;
    return this.trigger.isTriggered(triggerName);
  }

  activate(triggerId: string, context: FightingContext): void {
    if ('activate' in this.trigger) {
      (this.trigger as ActivatableTrigger).activate(triggerId, context);
    }
  }

  lifecycleEndEvent(): string | undefined {
    if (this.isExhaustedCheck()) return undefined;
    return this.endEvent;
  }

  private isExhaustedCheck(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}
