import { Trigger } from './trigger';

export const AFTER_ATTACK = 'after-attack';

/**
 * Fires on the attacker after each of its attacks that targeted somebody
 * (plain, next-action, turn-start or special), with the card the attack was
 * aimed at as `attackTarget`. Reactive attacks do not count.
 */
export class AfterAttackTrigger implements Trigger {
  public readonly id = AFTER_ATTACK;

  isTriggered(triggerName: string): boolean {
    return triggerName === AFTER_ATTACK;
  }
}
