import { FightingCard } from '../fighting-card';
import { HealingResults } from '../@types/action-result/healing-results';
import { BuffResults } from '../@types/action-result/buff-results';
import { DebuffResults } from '../@types/action-result/debuff-results';
import { AttackResult } from '../@types/action-result/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { TargetingOverrideReport } from '../../fight-simulator/@types/targeting-override-report';

export enum SkillKind {
  Healing = 'healing',
  Buff = 'buff',
  Debuff = 'debuff',
  Attack = 'attack',
  TargetingOverride = 'targeting_override',
}

export type SkillResults = {
  skillKind: SkillKind;
  results:
    | HealingResults
    | BuffResults
    | DebuffResults
    | AttackResult[]
    | TargetingOverrideReport[];
  endEvent?: string;
  powerId?: string;
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

  /**
   * Advances internal state (e.g., turn counter). Called each action turn.
   * Optional — only skills with stateful counters implement this.
   */
  tick?(): void;

  /**
   * Returns the end event name if the skill has a lifecycle limit and is not yet exhausted.
   * Returns undefined if the skill has no end event or is already exhausted.
   */
  lifecycleEndEvent?(): string | undefined;
}
