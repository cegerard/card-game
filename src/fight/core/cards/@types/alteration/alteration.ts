import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Buff } from './buff';
import { BuffType } from './type';
import { CardInfo } from '../card-info';
import { AlterationCondition } from './alteration-condition';

export type AlterationResult = {
  target: CardInfo;
  buff: Buff;
};

export class Alteration {
  constructor(
    public readonly type: BuffType,
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
    public readonly condition?: AlterationCondition,
    public readonly conditionMultiplier?: number,
    public readonly terminationEvent?: string,
  ) {}

  public applyBuff(
    source: FightingCard,
    context: FightingContext,
  ): AlterationResult[] {
    const effectiveRate = this.condition?.evaluate(source, context)
      ? this.rate * this.conditionMultiplier
      : this.rate;

    const buffTargets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return buffTargets.map((target) => {
      const buff = target.applyBuff(
        this.type,
        effectiveRate,
        this.duration,
        this.terminationEvent,
      );
      return { target: target.identityInfo, buff };
    });
  }
}
