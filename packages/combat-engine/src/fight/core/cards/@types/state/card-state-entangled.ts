import { StateResult } from '../action-result/state-result';
import { FightingCard } from '../../fighting-card';
import { CardState } from './card-state';

export function assertFailChance(failChance: number): void {
  if (failChance <= 0 || failChance > 1) {
    throw new Error(`Entangle failChance must be in ]0, 1], got ${failChance}`);
  }
}

/**
 * A control status with no clock: it waits for the next offensive action of
 * its bearer, which fails on `failChance`, and goes with it either way.
 */
export class CardStateEntangled implements CardState {
  public readonly type = 'entangle' as const;
  public readonly remainingTurns = 1;

  constructor(
    public readonly failChance: number,
    public readonly terminationEvent?: string,
  ) {
    assertFailChance(failChance);
  }

  /** Nothing ticks: the entanglement only answers the next offensive action. */
  public applyState(card: FightingCard): StateResult {
    return {
      type: this.type,
      card,
      damage: 0,
      remainingHealth: card.actualHealth,
      remainingTurns: this.remainingTurns,
    };
  }
}
