import { Trigger } from './trigger';

export const ENEMY_KILLED = 'enemy-killed';

/**
 * Fires on the card that dealt a fatal blow to an enemy. The event carries
 * the health ratio the victim had just before that blow
 * (`enemy-killed:<ratio>`), so a threshold can ask for the kill of a target
 * already weakened; without one, every kill fires it.
 */
export class EnemyKilledTrigger implements Trigger {
  public readonly id = ENEMY_KILLED;

  constructor(private readonly threshold?: number) {
    if (threshold !== undefined && (threshold <= 0 || threshold > 1)) {
      throw new Error(
        `EnemyKilledTrigger threshold must be in ]0, 1], got ${threshold}`,
      );
    }
  }

  isTriggered(triggerName: string): boolean {
    const [event, ratio] = triggerName.split(':');
    if (event !== ENEMY_KILLED) return false;

    return this.threshold === undefined || Number(ratio) < this.threshold;
  }
}
