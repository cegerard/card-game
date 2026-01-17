import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
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
   * @param context - The context of the fight.
   * @returns The result of the special skill attack.
   */
  launch(source: FightingCard, context: FightingContext): SpecialResult;

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
