import { FightingCard } from '../fighting-card';
import { Trigger } from '../../trigger/trigger';
import { EnergySkillResults, Skill, SkillKind } from './skill';

/** Fills the special gauge of its owner by `amount` each time its event fires. */
export class EnergyGainSkill implements Skill {
  public readonly id = 'energy-gain';

  constructor(
    public readonly name: string,
    private readonly amount: number,
    private readonly trigger: Trigger,
  ) {
    if (!Number.isInteger(amount) || amount < 1) {
      throw new Error(
        `ENERGY_GAIN amount must be an integer >= 1, got ${amount}`,
      );
    }
  }

  launch(source: FightingCard): EnergySkillResults {
    const before = source.actualEnergy;
    const energy = source.gainEnergy(this.amount);

    return {
      skillKind: SkillKind.Energy,
      name: this.name,
      amount: energy - before,
      energy,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }
}
