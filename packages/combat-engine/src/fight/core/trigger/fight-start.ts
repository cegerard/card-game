import { Trigger } from './trigger';

export const FIGHT_START = 'fight-start';

/**
 * Fires once on every card, right after the fight is opened and before the
 * first action — for what a card brings into the fight with it.
 */
export class FightStart implements Trigger {
  public readonly id = FIGHT_START;

  isTriggered(triggerId: string): boolean {
    return triggerId === FIGHT_START;
  }
}
