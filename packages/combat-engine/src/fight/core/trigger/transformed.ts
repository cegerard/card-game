import { Trigger } from './trigger';

export const TRANSFORMED = 'transformed';

/**
 * Fires on a card right after its transformation started, so a power can
 * reach the enemies the transformation itself cannot.
 */
export class TransformedTrigger implements Trigger {
  public readonly id = TRANSFORMED;

  isTriggered(triggerName: string): boolean {
    return triggerName === TRANSFORMED;
  }
}
