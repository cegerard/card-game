import { TurnEnd } from '../core/trigger/turn-end';

export class TriggerFactory {
  static create(triggerName: string) {
    switch (triggerName) {
      case 'turn-end':
        return new TurnEnd();
      default:
        throw new Error(`Trigger unknown: ${triggerName}`);
    }
  }
}
