import { Trigger } from './trigger';

export const ALLY_SKILL_USED = 'ally-skill-used';

/**
 * Fires on the teammates of a card whose action was not a plain attack: a
 * special, a skill taking its action, or a strike at the start of its turn.
 */
export class AllySkillUsedTrigger implements Trigger {
  public readonly id = ALLY_SKILL_USED;

  isTriggered(triggerId: string): boolean {
    return triggerId === ALLY_SKILL_USED;
  }
}
