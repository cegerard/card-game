import { Trigger } from './trigger';

export class TurnEnd implements Trigger {
  isTriggered(triggerName: string): boolean {
    return 'turn-end' === triggerName;
  }
}
