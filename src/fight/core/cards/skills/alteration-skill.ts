import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { FightingContext } from '../@types/fighting-context';
import { BuffType } from '../@types/buff/type';
import { Skill, SkillKind, SkillResults } from './skill';
import { BuffCondition } from '../@types/buff/buff-condition';

/**
 * Unified skill that applies a positive (buff) or negative (debuff) stat alteration.
 *
 * @param polarity - 'buff' for positive alterations, 'debuff' for negative
 * @param duration - Number of turns the alteration lasts. Use Infinity for alterations that
 *   persist until an event fires (event-bound) or indefinitely (permanent).
 * @param terminationEvent - Event name that removes this buff when fired by
 *   EndEventProcessor. Pair with duration=Infinity for event-bound buffs.
 * @param endEvent - Event emitted when activationLimit is reached. Must match
 *   the terminationEvent of the buffs to remove via EndEventProcessor.
 * @param activationLimit - Max number of times this skill fires before its
 *   lifecycle ends and endEvent is emitted.
 */
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
  private activationCount = 0;

  constructor(
    polarity: 'buff' | 'debuff',
    attributeType: BuffType,
    rate: number,
    duration: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
    activationCondition?: BuffCondition,
    activationLimit?: number,
    endEvent?: string,
    terminationEvent?: string,
  ) {
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
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
    if (
      this.activationCondition &&
      !this.activationCondition.evaluate(source, context)
    ) {
      return { skillKind: this.resolveSkillKind(), results: [] };
    }

    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const results =
      this.polarity === 'buff'
        ? targetedCards.map((targetedCard) => ({
            target: targetedCard.identityInfo,
            buff: targetedCard.applyBuff(
              this.attributeType,
              this.rate,
              this.duration,
              this.terminationEvent,
            ),
          }))
        : targetedCards.map((targetedCard) => ({
            target: targetedCard.identityInfo,
            debuff: targetedCard.applyDebuff(
              this.attributeType,
              this.rate,
              this.duration,
            ),
          }));

    this.activationCount++;

    const isExhausted =
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit;

    return {
      skillKind: this.resolveSkillKind(),
      results,
      endEvent: isExhausted ? this.endEvent : undefined,
    };
  }

  isTriggered(triggerName: string): boolean {
    if (this.isExhausted()) return false;
    return this.trigger.isTriggered(triggerName);
  }

  lifecycleEndEvent(): string | undefined {
    if (this.isExhausted()) return undefined;
    return this.endEvent;
  }

  private resolveSkillKind(): SkillKind {
    return this.polarity === 'buff' ? SkillKind.Buff : SkillKind.Debuff;
  }

  private isExhausted(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}
