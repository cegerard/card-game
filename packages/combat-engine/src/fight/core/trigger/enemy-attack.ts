import { Trigger } from './trigger';

export const ENEMY_ATTACK = 'enemy-attack';

/**
 * Fires on every playable card of a team once per enemy attack that targeted
 * one of its cards, landed or dodged, with that enemy as `lastAttacker`.
 * Reactive attacks (counters, reactions) do not count, so it cannot recurse.
 */
export class EnemyAttackTrigger implements Trigger {
  public readonly id = ENEMY_ATTACK;

  isTriggered(triggerName: string): boolean {
    return triggerName === ENEMY_ATTACK;
  }
}
