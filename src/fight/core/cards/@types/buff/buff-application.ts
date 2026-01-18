import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { Buff } from './buff';
import { BuffType } from './type';
import { CardInfo } from '../card-info';

export type BuffApplicationResult = {
  target: CardInfo;
  buff: Buff;
};

export class BuffApplication {
  constructor(
    public readonly type: BuffType,
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public applyBuff(
    source: FightingCard,
    context: FightingContext,
  ): BuffApplicationResult[] {
    const buffTargets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return buffTargets.map((target) => {
      const buff = target.applyBuff(this.type, this.rate, this.duration);
      return { target: target.identityInfo, buff };
    });
  }
}
