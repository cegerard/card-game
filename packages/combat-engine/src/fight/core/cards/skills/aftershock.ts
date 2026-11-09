import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { Splash } from '../@types/attack/splash';
import { Trigger } from '../../trigger/trigger';
import { AttackSkillResults, Skill, SkillKind } from './skill';

/**
 * Strikes the deck neighbors of the card its owner attack was aimed at
 * (`attackTarget`), not that card itself. Meant for `after-attack`; strikes
 * nobody without an attack target.
 */
export class AftershockSkill implements Skill {
  public readonly id = 'aftershock';

  constructor(
    public readonly name: string,
    private readonly splash: Splash,
    private readonly trigger: Trigger,
    public readonly requiredStance?: string,
  ) {}

  launch(source: FightingCard, context: FightingContext): AttackSkillResults {
    return {
      skillKind: SkillKind.Attack,
      name: this.name,
      results: context.attackTarget
        ? this.splash.strike(source, context.attackTarget, context).results
        : [],
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
