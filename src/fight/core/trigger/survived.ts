import { Trigger } from './trigger';

export class SurvivedTrigger implements Trigger {
  public id = 'survived';

  isTriggered(triggerId: string): boolean {
    return this.id === triggerId;
  }
}
