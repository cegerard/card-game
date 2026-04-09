import { FightingContext } from '../cards/@types/fighting-context';
import { Trigger } from './trigger';

export class DynamicTrigger implements Trigger {
  public id = 'dormant';
  private activated = false;
  private activationTrigger: Trigger;
  private buildReplacementTrigger: (cardId: string) => Trigger;
  private replacementTrigger?: Trigger;

  constructor(
    activationTrigger: Trigger,
    buildReplacementTrigger: (cardId: string) => Trigger,
  ) {
    this.activationTrigger = activationTrigger;
    this.buildReplacementTrigger = buildReplacementTrigger;
  }

  isTriggered(triggerId: string, context?: FightingContext): boolean {
    if (!this.activated) {
      if (this.activationTrigger.isTriggered(triggerId)) {
        const killerCardId = context?.killerCard?.id;
        if (!killerCardId) {
          throw new Error(
            'Dynamic trigger activation requires killerCard in context',
          );
        }
        this.replacementTrigger = this.buildReplacementTrigger(killerCardId);
        this.activated = true;
      }
      return false;
    }
    return this.replacementTrigger!.isTriggered(triggerId);
  }
}
