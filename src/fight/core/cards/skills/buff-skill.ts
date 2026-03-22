import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { FightingContext } from '../@types/fighting-context';
import { BuffType } from '../@types/buff/type';
import { Skill, SkillKind, SkillResults } from './skill';
import { BuffCondition } from '../@types/buff/buff-condition';

export class BuffSkill implements Skill {
  public id = 'buff-skill';

  private readonly buffType: BuffType;
  private readonly buffRate: number;
  private readonly duration: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;
  private readonly activationCondition?: BuffCondition;
  private readonly activationLimit?: number;
  private readonly endEvent?: string;
  private readonly terminationEvent?: string;
  private activationCount = 0;

  constructor(
    buffType: BuffType,
    buffRate: number,
    duration: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
    activationCondition?: BuffCondition,
    activationLimit?: number,
    endEvent?: string,
    terminationEvent?: string,
  ) {
    this.buffType = buffType;
    this.buffRate = buffRate;
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
      return { skillKind: SkillKind.Buff, results: [] };
    }

    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const buffResults = targetedCards.map((targetedCard) => {
      const buff = targetedCard.applyBuff(
        this.buffType,
        this.buffRate,
        this.duration,
        this.terminationEvent,
      );

      return {
        target: targetedCard.identityInfo,
        buff,
      };
    });

    this.activationCount++;

    const isExhausted =
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit;

    return {
      skillKind: SkillKind.Buff,
      results: buffResults,
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

  private isExhausted(): boolean {
    return (
      this.activationLimit !== undefined &&
      this.activationCount >= this.activationLimit
    );
  }
}
