import { Trigger } from './trigger';

export const SELF_DEATH_PREFIX = 'self-death';

/**
 * Fires on the card that just died, for its own last words.
 *
 * Every other death trigger runs on somebody else — `ally-death` and
 * `enemy-death` reach the survivors, never the fallen. A card that leaves
 * something behind when it goes needs to act on its own death, so the handler
 * gives it one pass before the survivors react.
 */
export class SelfDeathTrigger implements Trigger {
  public readonly id = 'self-death';

  constructor(private readonly cardId: string) {}

  isTriggered(triggerName: string): boolean {
    return triggerName === `${SELF_DEATH_PREFIX}:${this.cardId}`;
  }
}
