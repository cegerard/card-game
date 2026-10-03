import { Trigger } from './trigger';

export const ENEMY_BLEED_DEATH = 'enemy-bleed-death';

/**
 * Fires on the survivors of the opposing team when a card dies from its bleed
 * at turn end. It names nobody: whoever bled out, the predator answers.
 */
export class EnemyBleedDeathTrigger implements Trigger {
  public readonly id = ENEMY_BLEED_DEATH;

  isTriggered(triggerName: string): boolean {
    return triggerName === ENEMY_BLEED_DEATH;
  }
}
