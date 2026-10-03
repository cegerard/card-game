import { Trigger } from './trigger';

export const BLEED_STACKS_APPLIED = 'bleed-stacks-applied';

/**
 * Fires once, the first time its owner has laid `threshold` bleed stacks
 * since the fight began. The event carries the owner running count
 * (`bleed-stacks-applied:<count>`), so a count jumping over the threshold
 * still fires.
 */
export class BleedStacksAppliedTrigger implements Trigger {
  public readonly id = BLEED_STACKS_APPLIED;
  private fired = false;

  constructor(private readonly threshold: number) {
    if (threshold < 1) {
      throw new Error(
        `BleedStacksAppliedTrigger threshold must be greater than or equal to 1, got ${threshold}`,
      );
    }
  }

  isTriggered(triggerName: string): boolean {
    const [event, count] = triggerName.split(':');
    if (this.fired || event !== BLEED_STACKS_APPLIED) return false;

    this.fired = Number(count) >= this.threshold;
    return this.fired;
  }
}
