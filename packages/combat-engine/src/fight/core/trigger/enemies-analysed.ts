import { Trigger } from './trigger';

export const ENEMIES_ANALYSED = 'enemies-analysed';

/**
 * Fires on a card once its analysis has filled every living enemy with
 * charges.
 */
export class EnemiesAnalysedTrigger implements Trigger {
  public readonly id = ENEMIES_ANALYSED;

  isTriggered(triggerName: string): boolean {
    return triggerName === ENEMIES_ANALYSED;
  }
}
