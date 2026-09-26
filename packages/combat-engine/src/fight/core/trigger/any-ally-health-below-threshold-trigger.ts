import { FightingContext } from '../cards/@types/fighting-context';
import { ActivatableTrigger } from './activatable-trigger';

const EVENT_PREFIX = 'ally-health-';

/**
 * Fires when any ally crosses a health threshold downward, where
 * `AllyHealthBelowThresholdTrigger` watches one ally named up front. Each ally
 * is edge-triggered on its own: the trigger fires once per crossing and rearms
 * for that ally when its health recovers above the threshold.
 *
 * The owner is skipped — a guardian reacts to someone else being in danger,
 * and a card watching its own health already has the single-ally trigger.
 */
export class AnyAllyHealthBelowThresholdTrigger implements ActivatableTrigger {
  public readonly id = 'any-ally-health-below-threshold';

  private readonly allyWasAboveThreshold = new Map<string, boolean>();
  private firingAllyId: string | null = null;

  constructor(
    private readonly threshold: number,
    private readonly ownerId: string,
  ) {}

  isTriggered(triggerId: string): boolean {
    return (
      this.firingAllyId !== null &&
      triggerId === `${EVENT_PREFIX}${this.firingAllyId}`
    );
  }

  activate(triggerId: string, context: FightingContext): void {
    const allyId = this.extractAllyId(triggerId);
    if (!allyId) return;

    this.firingAllyId = null;
    if (allyId === this.ownerId) return;

    const ally = context.sourcePlayer.allCards.find((c) => c.id === allyId);
    if (!ally) return;

    const wasAbove = this.allyWasAboveThreshold.get(allyId) ?? true;
    const nowBelow = ally.healthRatio < this.threshold;

    this.allyWasAboveThreshold.set(allyId, !nowBelow);

    if (wasAbove && nowBelow) {
      this.firingAllyId = allyId;
    }
  }

  private extractAllyId(triggerId: string): string | undefined {
    if (!triggerId.startsWith(EVENT_PREFIX)) return undefined;

    return triggerId.slice(EVENT_PREFIX.length);
  }
}
