import { FightingCard } from '../../fighting-card';
import { AttackResult } from '../action-result/attack-result';
import { ExecutionResult } from '../action-result/execution-result';

/**
 * Finishes off every defender an attack hit and left alive strictly under
 * `threshold` of its health. The execution is a fatal blow like any other, so
 * an unconsumed SURVIVE still leaves the defender at 1 HP.
 */
export class Execution {
  constructor(private readonly threshold: number) {
    if (!(threshold > 0 && threshold < 1)) {
      throw new Error(
        `Execution threshold must be within ]0, 1[, got ${threshold}`,
      );
    }
  }

  public apply(results: AttackResult[]): ExecutionResult[] {
    const condemned = new Set(
      results
        .filter((r) => !r.dodge && !r.defender.isDead())
        .map((r) => r.defender)
        .filter((defender) => defender.healthRatio < this.threshold),
    );

    return [...condemned].map((card) => {
      const execution = { card, ...card.execute() };
      this.lastHitOn(card, results).remainingHealth = card.actualHealth;

      return execution;
    });
  }

  /** The hit snapshot is taken before the blow: the last one must show it. */
  private lastHitOn(card: FightingCard, results: AttackResult[]): AttackResult {
    const hits = results.filter((r) => r.defender === card);

    return hits[hits.length - 1];
  }
}
