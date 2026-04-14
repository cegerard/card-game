import { FightingContext } from '../cards/@types/fighting-context';
import { ActivatableTrigger } from './activatable-trigger';
import { Trigger } from './trigger';

export class DynamicTrigger implements ActivatableTrigger {
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

  activate(triggerId: string, context: FightingContext): void {
    if (this.activated) return;
    if (!this.activationTrigger.isTriggered(triggerId)) return;
    const killerCardId = context?.killerCard?.id;
    if (!killerCardId) {
      // Activation event observed without a killer (e.g. status-effect death).
      // Cannot build a replacement trigger keyed on the killer; stay dormant.
      return;
    }
    this.replacementTrigger = this.buildReplacementTrigger(killerCardId);
    this.activated = true;
  }

  isTriggered(triggerId: string): boolean {
    if (!this.activated) return false;
    return this.replacementTrigger!.isTriggered(triggerId);
  }
}
