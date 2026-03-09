import { Trigger } from './trigger';

export class NextAction implements Trigger {
  public id = 'next-action';

  isTriggered(triggerId: string): boolean {
    return this.id === triggerId;
  }
}
