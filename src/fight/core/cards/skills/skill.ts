import { TargetingCardStrategy } from 'src/fight/core/targeting-card-strategies/targeting-card-strategy';
import { FightingCard } from '../fighting-card';
import { HealingResults } from '../@types/action-result/healing-results';
import { FightingContext } from '../@types/fighting-context';

export interface Skill {
  /**
   * Launches the skill.
   *
   * @param source - The card that is using the skill.
   * @param target - The card that is being targeted by the skill.
   * @returns The result of the skill.
   */
  launch(source: FightingCard, context: FightingContext): HealingResults;

  /**
   * Get the targeting strategy of the special skill.
   *
   * @returns The targeting strategy of the special skill.
   */
  getTargetingStrategy(): TargetingCardStrategy;

  /**
   * Checks if the skill is triggered.
   *
   * @param triggerName - The name of the trigger to check.
   * @returns True if the skill is triggered, false otherwise
   */
  isTriggered(triggerName: string): boolean;
}
