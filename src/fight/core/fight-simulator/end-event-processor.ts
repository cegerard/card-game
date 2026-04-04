import { Player } from '../player';
import { CardInfo } from '../cards/@types/card-info';
import { Step, StepKind } from './@types/step';

export class EndEventProcessor {
  constructor(
    private readonly player1: Player,
    private readonly player2: Player,
  ) {}

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

    const removed = allCards.flatMap((card) => {
      const removedBuffs = card.removeEventBoundBuffs(eventName);
      return removedBuffs.map((b) => ({
        target: card.identityInfo,
        kind: b.type,
        value: b.value,
      }));
    });

    if (removed.length > 0) {
      steps.push({
        kind: StepKind.BuffRemoved,
        source,
        eventName,
        removed,
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
