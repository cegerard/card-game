import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { FightingContext } from '../@types/fighting-context';
import { BuffType } from '../@types/buff/buff-type';
import { Skill, SkillKind, SkillResults } from './skill';

export class BuffSkill implements Skill {
  public id = 'buff-skill';

  private readonly buffType: BuffType;
  private readonly buffRate: number;
  private readonly duration: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;

  constructor(
    buffType: BuffType,
    buffRate: number,
    duration: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
  ) {
    this.buffType = buffType;
    this.buffRate = buffRate;
    this.duration = duration;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
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
      );

      return {
        target: targetedCard.identityInfo,
        buff,
      };
    });

    return {
      skillKind: SkillKind.Buff,
      results: buffResults,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
