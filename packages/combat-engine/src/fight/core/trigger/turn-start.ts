import { Trigger } from './trigger';

export const TURN_START = 'turn-start';

/**
 * Fires on the card about to act, before its own action — and therefore
 * before its special gauge is checked. A card skipping its turn (frozen or
 * stunned) never sees it.
 */
export class TurnStart implements Trigger {
  public readonly id = TURN_START;

  isTriggered(triggerId: string): boolean {
    return triggerId === TURN_START;
  }
}
