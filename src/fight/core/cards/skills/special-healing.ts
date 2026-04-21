import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { Special } from './special';
import { SpecialResult } from '../@types/action-result/special-result';

const ENERGY_INCREASE_FACTOR = 10;

export class SpecialHealing implements Special {
  constructor(
    readonly name: string,
    private readonly rate: number,
    private readonly energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
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
      const healed = target.heal(source.actualAttack * this.rate);

      return { healed, target };
    });

    return { actionResults, buffResults: [] };
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialHealing';
  }
}
