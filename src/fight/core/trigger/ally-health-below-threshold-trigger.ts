import { FightingContext } from '../cards/@types/fighting-context';
import { ActivatableTrigger } from './activatable-trigger';

export class AllyHealthBelowThresholdTrigger implements ActivatableTrigger {
  public readonly id = 'ally-health-below-threshold';

  private wasAboveThreshold = true;
  private shouldFire = false;

  constructor(
    private readonly monitoredAllyId: string,
    private readonly threshold: number,
  ) {}

  isTriggered(triggerId: string): boolean {
    if (triggerId !== `ally-health-${this.monitoredAllyId}`) return false;
    return this.shouldFire;
  }

  activate(triggerId: string, context: FightingContext): void {
    if (triggerId !== `ally-health-${this.monitoredAllyId}`) return;

    const attackerPlayer =
      context.lastAttacker &&
      context.sourcePlayer.allCards.some((c) => c === context.lastAttacker)
        ? context.sourcePlayer
        : context.opponentPlayer;
    const allyPlayer =
      attackerPlayer === context.sourcePlayer
        ? context.opponentPlayer
        : context.sourcePlayer;

    const ally =
      allyPlayer.allCards.find((c) => c.id === this.monitoredAllyId) ??
      attackerPlayer.allCards?.find((c) => c.id === this.monitoredAllyId);
    if (!ally) return;

    const nowBelow = ally.healthRatio < this.threshold;

    if (this.wasAboveThreshold && nowBelow) {
      this.shouldFire = true;
      this.wasAboveThreshold = false;
    } else if (!nowBelow) {
      this.shouldFire = false;
      this.wasAboveThreshold = true;
    } else {
      this.shouldFire = false;
    }
  }
}
