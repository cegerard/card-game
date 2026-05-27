import { Player } from '../player';
import { CardInfo } from '../cards/@types/card-info';
import { Step, StepKind } from './@types/step';

export class EndEventProcessor {
  constructor(
    private readonly player1: Player,
    private readonly player2: Player,
  ) {}

  /**
   * Processes an end event across all living cards in three sweeps:
   * 1. **Buff removal** – removes all buffs whose `terminationEvent` matches `eventName`
   *    and emits a single `buff_removed` step listing every removed buff.
   * 2. **Effect removal** – removes all status effects (poison, burn, freeze) whose
   *    `terminationEvent` matches `eventName` and emits a single `effect_removed` step.
   * 3. **Targeting revert** – restores any targeting overrides whose `terminationEvent`
   *    matches `eventName` and emits one `targeting_reverted` step per reverted override.
   *
   * @param eventName - The end-event name to match against bound buffs, effects, and targeting overrides.
   * @param source - Identity of the card whose skill emitted the end event.
   * @param powerId - Optional composite-power identifier forwarded to each emitted step.
   * @returns Ordered list of steps produced by the three sweeps (may be empty).
   */
  public processEndEvent(
    eventName: string,
    source: CardInfo,
    powerId?: string,
  ): Step[] {
    const steps: Step[] = [];
    const allCards = [
      ...this.player1.playableCards,
      ...this.player2.playableCards,
    ];

    const removedBuffs = allCards.flatMap((card) => {
      const removedBuffs = card.removeEventBoundBuffs(eventName);
      return removedBuffs.map((b) => ({
        target: card.identityInfo,
        kind: b.type,
        value: b.value,
      }));
    });

    if (removedBuffs.length > 0) {
      steps.push({
        kind: StepKind.BuffRemoved,
        source,
        eventName,
        removed: removedBuffs,
        powerId,
      });
    }

    const removedDebuffs = allCards.flatMap((card) => {
      const debuffs = card.removeEventBoundDebuffs(eventName);
      return debuffs.map((d) => ({
        target: card.identityInfo,
        kind: d.type,
        value: d.value,
      }));
    });

    if (removedDebuffs.length > 0) {
      steps.push({
        kind: StepKind.DebuffRemoved,
        source,
        eventName,
        removed: removedDebuffs,
        powerId,
      });
    }

    const removedEffects = allCards.flatMap((card) => {
      return card.removeEventBoundEffects(eventName).map((e) => ({
        target: e.card,
        effectType: e.type,
      }));
    });

    if (removedEffects.length > 0) {
      steps.push({
        kind: StepKind.EffectRemoved,
        source,
        eventName,
        removed: removedEffects,
        powerId,
      });
    }

    for (const card of allCards) {
      const removedOverrides = card.restoreAttackTargeting(eventName);
      for (const override of removedOverrides) {
        steps.push({
          kind: StepKind.TargetingReverted,
          source: card.identityInfo,
          eventName,
          revertedStrategy: override.strategy.id,
          restoredStrategy: card.attackTargetingId,
          powerId: override.powerId,
        });
      }
    }

    return steps;
  }
}
