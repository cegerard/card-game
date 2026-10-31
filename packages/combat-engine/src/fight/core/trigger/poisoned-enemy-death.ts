import { Trigger } from './trigger';

export const POISONED_ENEMY_DEATH = 'poisoned-enemy-death';

/**
 * Fires on the card that laid the stacked poison an enemy carried when it
 * died, whatever dealt the fatal blow. Only that poisoner hears of it.
 */
export class PoisonedEnemyDeathTrigger implements Trigger {
  public readonly id = POISONED_ENEMY_DEATH;

  isTriggered(triggerName: string): boolean {
    return triggerName === POISONED_ENEMY_DEATH;
  }
}
