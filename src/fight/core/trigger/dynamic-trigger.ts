import { FightingContext } from '../cards/@types/fighting-context';
import { ActivatableTrigger } from './activatable-trigger';
import { Trigger } from './trigger';

type DynamicTriggerState =
  | { kind: 'dormant'; activation: Trigger }
  | { kind: 'active'; replacement: Trigger };

export class DynamicTrigger implements ActivatableTrigger {
  public id = 'dormant';
  private state: DynamicTriggerState;
  private buildReplacementTrigger: (cardId: string) => Trigger;

  constructor(
    activationTrigger: Trigger,
    buildReplacementTrigger: (cardId: string) => Trigger,
  ) {
    this.state = { kind: 'dormant', activation: activationTrigger };
    this.buildReplacementTrigger = buildReplacementTrigger;
  }

  activate(triggerId: string, context: FightingContext): void {
    if (this.state.kind === 'active') return;
    if (!this.state.activation.isTriggered(triggerId)) return;
    const killerCardId = context?.killerCard?.id;
    if (!killerCardId) {
      // Activation event observed without a killer (e.g. status-effect death).
      // Cannot build a replacement trigger keyed on the killer; stay dormant.
      return;
    }
    // Activation consumes this event; replacement only matches subsequent events.
    this.state = {
      kind: 'active',
      replacement: this.buildReplacementTrigger(killerCardId),
    };
  }

  isTriggered(triggerId: string): boolean {
    if (this.state.kind !== 'active') return false;
    return this.state.replacement.isTriggered(triggerId);
  }
}
