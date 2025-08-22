import { FightingCard } from '../fighting-card';
import { HealingResults } from '../@types/action-result/healing-results';
import { BuffResults } from '../@types/action-result/buff-results';
import { FightingContext } from '../@types/fighting-context';

export enum SkillKind {
  Healing = 'healing',
  Buff = 'buff',
}

export type SkillResults = {
  skillKind: SkillKind;
  results: HealingResults | BuffResults;
};

export interface Skill {
  id: string;

  /**
   * Launches the skill.
   *
   * @param source - The card that is using the skill.
   * @param context - The fighting context.
   * @returns The result of the skill.
   */
  launch(source: FightingCard, context: FightingContext): SkillResults;

  /**
   * Checks if the skill is triggered.
   *
   * @param triggerName - The name of the trigger to check.
   * @returns True if the skill is triggered, false otherwise
   */
  isTriggered(triggerName: string): boolean;
}
