import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { BaseSpecial } from './special';
import { SpecialResult } from '../@types/action-result/special-result';
import { applyHealing } from './heal-basis';

export class SpecialHealing extends BaseSpecial {
  constructor(
    name: string,
    private readonly rate: number,
    energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
  ) {
    super(name, energyNeeded);
  }

  public launch(
    source: FightingCard,
    context: FightingContext,
    _targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult {
    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const actionResults = targetedCards.map((target) => {
      const healed = applyHealing(source, target, this.rate);
      const remainingHealth = target.actualHealth;

      return { healed, target, remainingHealth };
    });

    return {
      name: this.name,
      actionResults,
      alterationResults: [],
      shieldResults: [],
    };
  }

  public getSpecialKind(): string {
    return 'specialHealing';
  }
}
