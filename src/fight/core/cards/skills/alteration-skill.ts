import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { ActivatableTrigger } from '../../trigger/activatable-trigger';
import { FightingContext } from '../@types/fighting-context';
import { BuffType } from '../@types/buff/type';
import { Skill, SkillKind, SkillResults } from './skill';
import { BuffCondition } from '../@types/buff/buff-condition';

export interface AlterationSkillOptions {
  polarity: 'buff' | 'debuff';
  attributeType: BuffType;
  rate: number;
  /** Number of turns the alteration lasts. Use Infinity for event-bound or permanent buffs. */
  duration: number;
  trigger: Trigger;
  targetingStrategy: TargetingCardStrategy;
  activationCondition?: BuffCondition;
  activationLimit?: number;
  endEvent?: string;
  terminationEvent?: string;
  powerId?: string;
}

export class AlterationSkill implements Skill {
  public id = 'alteration-skill';

  private readonly polarity: 'buff' | 'debuff';
  private readonly attributeType: BuffType;
  private readonly rate: number;
  private readonly duration: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;
  private readonly activationCondition?: BuffCondition;
  private readonly activationLimit?: number;
  private readonly endEvent?: string;
  private readonly terminationEvent?: string;
  private readonly powerId?: string;
  private activationCount = 0;

  constructor({
    polarity,
    attributeType,
    rate,
    duration,
    trigger,
    targetingStrategy,
    activationCondition,
    activationLimit,
    endEvent,
    terminationEvent,
    powerId,
  }: AlterationSkillOptions) {
    this.polarity = polarity;
    this.attributeType = attributeType;
    this.rate = rate;
    this.duration = duration;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
    this.activationCondition = activationCondition;
    this.activationLimit = activationLimit;
    this.endEvent = endEvent;
    this.terminationEvent = terminationEvent;
    this.powerId = powerId;
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): SkillResults {
    if (
      this.activationCondition &&
      !this.activationCondition.evaluate(source, context)
    ) {
      return this.polarity === 'buff'
        ? { skillKind: SkillKind.Buff, results: [], powerId: this.powerId }
        : { skillKind: SkillKind.Debuff, results: [], powerId: this.powerId };
    }

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

    if (this.polarity === 'buff') {
      const results = targetedCards.map((targetedCard) => ({
        target: targetedCard.identityInfo,
        buff: targetedCard.applyBuff(
          this.attributeType,
          this.rate,
          this.duration,
          this.terminationEvent,
          this.powerId,
        ),
      }));
      return {
        skillKind: SkillKind.Buff,
        results,
        endEvent,
        powerId: this.powerId,
      };
    }

    const results = targetedCards.map((targetedCard) => ({
      target: targetedCard.identityInfo,
      debuff: targetedCard.applyDebuff(
        this.attributeType,
        this.rate,
        this.duration,
        this.powerId,
      ),
    }));
    return {
      skillKind: SkillKind.Debuff,
      results,
      endEvent,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    if (this.isExhausted()) return false;
    return this.trigger.isTriggered(triggerName);
  }

  activate(triggerId: string, context: FightingContext): void {
    if ('activate' in this.trigger) {
      (this.trigger as ActivatableTrigger).activate(triggerId, context);
    }
  }

  lifecycleEndEvent(): string | undefined {
    if (this.isExhausted()) return undefined;
    return this.endEvent;
  }

  private isExhausted(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}
