import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { FightingContext } from '../@types/fighting-context';
import { DebuffType } from '../@types/buff/type';
import { Skill, SkillKind, SkillResults } from './skill';

export class DebuffSkill implements Skill {
  public id = 'debuff-skill';

  private readonly debuffType: DebuffType;
  private readonly debuffRate: number;
  private readonly duration: number;
  private readonly trigger: Trigger;
  private readonly targetingStrategy: TargetingCardStrategy;

  constructor(
    debuffType: DebuffType,
    debuffRate: number,
    duration: number,
    trigger: Trigger,
    targetingStrategy: TargetingCardStrategy,
  ) {
    this.debuffType = debuffType;
    this.debuffRate = debuffRate;
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

    const debuffResults = targetedCards.map((targetedCard) => {
      const debuff = targetedCard.applyDebuff(
        this.debuffType,
        this.debuffRate,
        this.duration,
      );

      return {
        target: targetedCard.identityInfo,
        debuff,
      };
    });

    return {
      skillKind: SkillKind.Debuff,
      results: debuffResults,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
