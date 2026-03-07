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

  constructor(
    buffType: BuffType,
    buffRate: number,
    duration: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
    activationCondition?: BuffCondition,
  ) {
    this.buffType = buffType;
    this.buffRate = buffRate;
    this.duration = duration;
    this.trigger = trigger;
    this.targetingStrategy = targetingStrategy;
    this.activationCondition = activationCondition;
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
