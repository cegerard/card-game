import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { SpecialResult } from '../@types/special-result';
import { FightingCard } from '../fighting-card';

/**
 * Interface representing a special skill in the card game.
 */
export interface Special {
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
   * @param target - The card that is being targeted by the special skill.
   * @returns The result of the special skill attack.
   */
  launch(source: FightingCard, target: FightingCard): SpecialResult;

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

  /**
   * Get the targeting strategy of the special skill.
   *
   * @returns The targeting strategy of the special skill.
   */
  getTargetingStrategy(): TargetingCardStrategy;
}
