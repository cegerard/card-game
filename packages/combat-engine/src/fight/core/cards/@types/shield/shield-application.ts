import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { ShieldResult } from '../action-result/shield-result';

/**
 * The shield a special lays besides its primary action, on its own targets
 * unless the special hands over the targets of that action instead.
 */
export class ShieldApplication {
  constructor(
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public apply(
    source: FightingCard,
    context: FightingContext,
    primaryTargets?: FightingCard[],
  ): ShieldResult[] {
    const targets =
      primaryTargets ??
      this.targetingStrategy.targetedCards(
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
