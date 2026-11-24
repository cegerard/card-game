import { RateBasis } from '@card-game/shared-types';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { BaseSpecial } from './special';
import { SpecialResult } from '../@types/action-result/special-result';
import { ShieldApplication } from '../@types/shield/shield-application';
import { applyHealing } from './heal-basis';

export type SpecialHealingOptions = {
  basis?: RateBasis;
  shield?: ShieldApplication;
  /** The shield goes to the healed targets rather than to its own targeting. */
  shieldsHealedTargets?: boolean;
  /** Laid on each healed target, under the name of the special. */
  healOverTime?: { rate: number; duration: number };
};

/**
 * Heals its targets, resolved once, lays its heal over time on those it
 * healed, then shields the healed targets or whom its shield targets. A
 * target cut off its allies support gets no heal but keeps the shield.
 */
export class SpecialHealing extends BaseSpecial {
  constructor(
    name: string,
    private readonly rate: number,
    energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly options: SpecialHealingOptions = {},
  ) {
    super(name, energyNeeded);
  }

  public launch(
    source: FightingCard,
    context: FightingContext,
    _targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult {
    const { basis, shield, shieldsHealedTargets, healOverTime } = this.options;
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const actionResults = targets
      .filter((target) => !target.refusesSupportFrom(source))
      .map((target) => {
        const healed = applyHealing(source, target, this.rate, basis);
        if (healOverTime) {
          target.receiveHealOverTime({
            name: this.name,
            source,
            ...healOverTime,
          });
        }

        return { healed, target, remainingHealth: target.actualHealth };
      });

    return {
      name: this.name,
      actionResults,
      alterationResults: [],
      shieldResults:
        shield?.apply(
          source,
          context,
          shieldsHealedTargets ? targets : undefined,
        ) ?? [],
    };
  }

  public getSpecialKind(): string {
    return 'specialHealing';
  }
}
