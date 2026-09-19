import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { AlterationType } from './alteration-type';
import { AlterationCondition } from './alteration-condition';
import { BuffResult, DebuffResult } from '../action-result/alteration-result';

export class Alteration {
  constructor(
    public readonly type: AlterationType,
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
    public readonly condition?: AlterationCondition,
    public readonly conditionMultiplier?: number,
    public readonly terminationEvent?: string,
    public readonly polarity: 'buff' | 'debuff' = 'buff',
  ) {
    if (condition !== undefined && conditionMultiplier === undefined) {
      throw new Error('conditionMultiplier is required when condition is set');
    }
  }

  public apply(
    source: FightingCard,
    context: FightingContext,
  ): BuffResult[] | DebuffResult[] {
    const effectiveRate = this.condition?.evaluate(source, context)
      ? this.rate * this.conditionMultiplier
      : this.rate;

    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    if (this.polarity === 'debuff') {
      // applyDebuff refuses an application that would exceed a stack cap, so
      // only the alterations that really landed are reported.
      return targets
        .map((target) => ({
          target: target.identityInfo,
          alteration: target.applyDebuff(
            this.type,
            effectiveRate,
            this.duration,
            this.terminationEvent,
          ),
        }))
        .filter((result) => result.alteration !== undefined);
    }

    return targets.map((target) => ({
      target: target.identityInfo,
      alteration: target.applyBuff(
        this.type,
        effectiveRate,
        this.duration,
        this.terminationEvent,
      ),
    }));
  }
}
