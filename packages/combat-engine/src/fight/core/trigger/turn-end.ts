import { Trigger } from './trigger';

export class TurnEnd implements Trigger {
  public id = 'turn-end';

  isTriggered(triggerId: string): boolean {
    return this.id === triggerId;
  }
}
