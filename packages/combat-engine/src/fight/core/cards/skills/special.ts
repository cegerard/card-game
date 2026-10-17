import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
import { FightingCard } from '../fighting-card';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

const ENERGY_INCREASE_FACTOR = 10;

/**
 * Interface representing a special skill in the card game.
 */
export interface Special {
  name: string;

  /**
   * Determines if the special skill is ready to be used based on the current energy level.
   *
   * @param actualEnergy - The current energy level.
   * @returns A boolean indicating whether the special skill is ready.
   */
  ready(actualEnergy: number): boolean;

  /**
   * Launches the special skill.
   *
   * @param source - The card that is using the special skill.
   * @param context - The context of the fight.
   * @param targetingStrategy - The override strategy to use instead of the skill's default strategy, if applicable
   * @returns The result of the special skill attack.
   */
  launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult;

  /**
   * Increases the current energy level.
   *
   * @param actualEnergy - The current energy level.
   * @returns The new energy level after the increase.
   */
  increaseEnergy(actualEnergy: number): number;

  /**
   * Get the kind of special skill.
   *
   * @returns The kind of special skill.
   */
  getSpecialKind(): string;
}

/**
 * Energy bookkeeping shared by every special: it is ready once the gauge
 * reaches `energyNeeded`, and gains a fixed amount each turn up to it.
 */
export abstract class BaseSpecial implements Special {
  constructor(
    readonly name: string,
    protected readonly energyNeeded: number,
  ) {}

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public abstract launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult;

  public abstract getSpecialKind(): string;
}
