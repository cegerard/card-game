import { Trigger } from './trigger';

/**
 * Fires each time the monitored card dodges an attack, evasions included. A
 * card monitors itself by passing its own id, like `damage-taken`.
 */
export class DodgeTrigger implements Trigger {
  public readonly id = 'dodge';

  constructor(private readonly monitoredCardId: string) {}

  isTriggered(triggerId: string): boolean {
    return triggerId === `dodge-${this.monitoredCardId}`;
  }
}
