import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { HealingResult } from '../@types/healing-result';
import { FightingCard } from '../fighting-card';
import { Special } from './special';

const ENERGY_INCREASE_FACTOR = 10;

export class SpecialHealing implements Special {
  constructor(
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
  ): HealingResult[] {
    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return targetedCards.map((target) => {
      const healed = target.heal(source.actualAttack * this.rate);

      return { healed, target };
    });
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialHealing';
  }

  public getTargetingStrategy(): TargetingCardStrategy {
    return this.targetingStrategy;
  }
}
