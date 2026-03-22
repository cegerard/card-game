import { Player } from '../player';
import { CardInfo } from '../cards/@types/card-info';
import { Step, StepKind } from './@types/step';

export class EndEventProcessor {
  constructor(
    private readonly player1: Player,
    private readonly player2: Player,
  ) {}

  public processEndEvent(eventName: string, source: CardInfo): Step[] {
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

    if (removed.length === 0) return [];

    return [
      {
        kind: StepKind.BuffRemoved,
        source,
        eventName,
        removed,
      },
    ];
  }
}
