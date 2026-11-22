import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { TargetingCardStrategy } from '../../../targeting-card-strategies/targeting-card-strategy';
import { ShieldResult } from '../action-result/shield-result';

/**
 * The shield a special lays besides its primary action. Without a targeting
 * of its own it lands on the cards that action targeted.
 */
export class ShieldApplication {
  constructor(
    public readonly rate: number,
    public readonly duration: number,
    public readonly targetingStrategy?: TargetingCardStrategy,
  ) {}

  public apply(
    source: FightingCard,
    context: FightingContext,
    primaryTargets?: FightingCard[],
  ): ShieldResult[] {
    return this.targetsOf(source, context, primaryTargets).map((target) => ({
      target: target.identityInfo,
      shield: target.applyShield(this.rate, this.duration),
    }));
  }

  private targetsOf(
    source: FightingCard,
    context: FightingContext,
    primaryTargets?: FightingCard[],
  ): FightingCard[] {
    if (this.targetingStrategy) {
      return this.targetingStrategy.targetedCards(
        source,
        context.sourcePlayer,
        context.opponentPlayer,
      );
    }
    if (!primaryTargets) {
      throw new Error(
        'A shield without targeting needs the targets of the primary action',
      );
    }
    return primaryTargets;
  }
}
