import { Trigger } from './trigger';

/**
 * Fires each time the monitored card takes damage from an attack.
 *
 * Unlike `AllyHealthBelowThresholdTrigger`, this trigger is not edge-triggered:
 * it fires on every landed hit, which is what reactive defenses (counter
 * attacks, damage mitigation) need. A card monitors itself by passing its own
 * id, following the `ally-health-below` convention.
 */
export class DamageTakenTrigger implements Trigger {
  public readonly id = 'damage-taken';

  constructor(private readonly monitoredCardId: string) {}

  isTriggered(triggerId: string): boolean {
    return triggerId === `damage-taken-${this.monitoredCardId}`;
  }
}
