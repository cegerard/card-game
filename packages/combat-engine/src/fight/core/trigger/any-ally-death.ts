import { Trigger } from './trigger';

export const ANY_ALLY_DEATH = 'any-ally-death';

/** Fires on the surviving teammates of any card that dies, whoever it was. */
export class AnyAllyDeathTrigger implements Trigger {
  public readonly id = ANY_ALLY_DEATH;

  isTriggered(triggerId: string): boolean {
    return triggerId === ANY_ALLY_DEATH;
  }
}
