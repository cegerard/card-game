import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { ShieldResult } from '../action-result/shield-result';

export class ShieldApplication {
  constructor(
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public apply(source: FightingCard, context: FightingContext): ShieldResult[] {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return targets.map((target) => ({
      target: target.identityInfo,
      shield: target.applyShield(this.rate, this.duration),
    }));
  }
}
