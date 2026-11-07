import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { Trigger } from '../../trigger/trigger';
import { Skill, SkillKind, SkillResults } from './skill';

/**
 * Lays its effect on every card targeted when its event fires, without an
 * attack: nothing to dodge, no damage dealt. The effect keeps its own rules
 * (probability, cap, immunity, resistance).
 */
export class AfflictionSkill implements Skill {
  public readonly id = 'affliction';

  constructor(
    public readonly name: string,
    private readonly effect: AttackEffect,
    private readonly trigger: Trigger,
    private readonly targetingStrategy: TargetingCardStrategy,
    public readonly requiredStance?: string,
  ) {}

  launch(source: FightingCard, context: FightingContext): SkillResults {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return {
      skillKind: SkillKind.Affliction,
      name: this.name,
      results: targets
        .map((target) => this.effect.applyEffect(target, source, context))
        .filter((result): result is EffectResult => result != null),
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
