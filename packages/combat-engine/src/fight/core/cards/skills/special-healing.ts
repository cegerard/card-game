import { RateBasis } from '@card-game/shared-types';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { BaseSpecial } from './special';
import { SpecialResult } from '../@types/action-result/special-result';
import { ShieldApplication } from '../@types/shield/shield-application';
import { applyHealing } from './heal-basis';

/**
 * Heals its targets, resolved once, then shields them when its shield names
 * the special targets, else whom the shield targets. A target cut off its
 * allies support gets no heal but keeps the shield.
 */
export class SpecialHealing extends BaseSpecial {
  constructor(
    name: string,
    private readonly rate: number,
    energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly basis?: RateBasis,
    private readonly shieldApplication?: ShieldApplication,
  ) {
    super(name, energyNeeded);
  }

  public launch(
    source: FightingCard,
    context: FightingContext,
    _targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const actionResults = targets
      .filter((target) => !target.refusesSupportFrom(source))
      .map((target) => {
        const healed = applyHealing(source, target, this.rate, this.basis);
        const remainingHealth = target.actualHealth;

        return { healed, target, remainingHealth };
      });

    return {
      name: this.name,
      actionResults,
      alterationResults: [],
      shieldResults:
        this.shieldApplication?.apply(source, context, targets) ?? [],
    };
  }

  public getSpecialKind(): string {
    return 'specialHealing';
  }
}
