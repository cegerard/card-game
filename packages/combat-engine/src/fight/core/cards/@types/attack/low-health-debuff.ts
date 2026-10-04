import { FightingCard } from '../../fighting-card';
import { AlterationType } from '../alteration/alteration-type';
import { DebuffResult } from '../action-result/alteration-result';

export type DebuffSpec = {
  type: AlterationType;
  rate: number;
  duration: number;
};

/**
 * Debuffs the target of a hit when it is left alive under `threshold` of its
 * health. Being under the threshold after the hit is enough: the hit does not
 * need to be the one crossing it. Resistance applies as for any debuff.
 */
export class LowHealthDebuff {
  constructor(
    public readonly name: string,
    private readonly threshold: number,
    private readonly debuffs: DebuffSpec[],
  ) {
    if (threshold <= 0 || threshold > 1) {
      throw new Error(
        `LowHealthDebuff threshold must be within ]0, 1], got ${threshold}`,
      );
    }
  }

  public apply(target: FightingCard): DebuffResult[] {
    if (target.isDead() || target.healthRatio >= this.threshold) return [];

    return this.debuffs
      .map(({ type, rate, duration }) => ({
        target: target.identityInfo,
        alteration: target.applyDebuff(type, rate, duration),
      }))
      .filter((result) => result.alteration !== undefined);
  }
}
