import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { StanceActivation } from '../@types/stance/stance';
import { RampingChance } from '../@types/stance/ramping-chance';
import { Alteration } from '../@types/alteration/alteration';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { Trigger } from '../../trigger/trigger';
import { Skill, SkillKind, SkillResults } from './skill';

export type StanceSkillOptions = {
  powerId?: string;
  /** Applied with the stance, each with its own targeting. */
  alterations?: Alteration[];
  /** Rolled at each event; the stance cannot open again while it runs. */
  chance?: RampingChance;
};

/**
 * Opens a stance on its owner when its event fires — the triggered
 * counterpart of a special `stanceActivation`. Skills requiring that stance
 * then run for exactly its duration.
 */
export class StanceSkill implements Skill {
  public readonly id = 'stance-skill';
  public readonly powerId?: string;
  private readonly alterations: Alteration[];
  private readonly chance?: RampingChance;

  constructor(
    public readonly name: string,
    private readonly stanceActivation: StanceActivation,
    private readonly trigger: Trigger,
    options: StanceSkillOptions = {},
  ) {
    this.powerId = options.powerId;
    this.alterations = options.alterations ?? [];
    this.chance = options.chance;
  }

  launch(source: FightingCard, context: FightingContext): SkillResults {
    if (
      this.chance &&
      !this.chance.roll(source.hasStance(this.stanceActivation.name))
    ) {
      return { skillKind: SkillKind.Stance, name: this.name, alterations: [] };
    }

    const stance = source.activateStance(this.stanceActivation);

    return {
      skillKind: SkillKind.Stance,
      name: this.name,
      stance,
      alterations: this.alterations.flatMap(
        (alteration) =>
          alteration.apply(source, context) as (BuffResult | DebuffResult)[],
      ),
      powerId: this.powerId,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
