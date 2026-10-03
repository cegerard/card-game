import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { StanceActivation } from '../@types/stance/stance';
import { Trigger } from '../../trigger/trigger';
import { Skill, SkillKind, SkillResults } from './skill';

/**
 * Opens a stance on its owner when its event fires — the triggered
 * counterpart of a special `stanceActivation`. Skills requiring that stance
 * then run for exactly its duration.
 */
export class StanceSkill implements Skill {
  public readonly id = 'stance-skill';

  constructor(
    public readonly name: string,
    private readonly stanceActivation: StanceActivation,
    private readonly trigger: Trigger,
    public readonly powerId?: string,
  ) {}

  launch(source: FightingCard, _context: FightingContext): SkillResults {
    const stance = source.activateStance(
      this.stanceActivation.name,
      this.stanceActivation.duration,
      this.stanceActivation.immunities,
    );

    return {
      skillKind: SkillKind.Stance,
      name: this.name,
      stance,
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
