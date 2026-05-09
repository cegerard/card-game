import { FightingCard } from '../fighting-card';
import { HealingResults } from '../@types/action-result/healing-results';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { AttackResult } from '../@types/action-result/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { TargetingOverrideReport } from '../../fight-simulator/@types/targeting-override-report';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export enum SkillKind {
  Healing = 'healing',
  Buff = 'buff',
  Debuff = 'debuff',
  Attack = 'attack',
  TargetingOverride = 'targeting_override',
}

type BaseSkillResults = {
  name?: string;
  endEvent?: string;
  powerId?: string;
};

export type HealingSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Healing;
  results: HealingResults;
};

export type BuffSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Buff;
  results: BuffResult[];
};

export type DebuffSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Debuff;
  results: DebuffResult[];
};

export type AttackSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Attack;
  results: AttackResult[];
};

export type TargetingOverrideSkillResults = BaseSkillResults & {
  skillKind: SkillKind.TargetingOverride;
  results: TargetingOverrideReport[];
};

export type SkillResults =
  | HealingSkillResults
  | BuffSkillResults
  | DebuffSkillResults
  | AttackSkillResults
  | TargetingOverrideSkillResults;

export interface Skill {
  id: string;
  name: string;

  /**
   * Executes the skill. When `targetingStrategy` is provided, it overrides
   * the skill's own default targeting strategy for this invocation.
   */
  launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SkillResults;

  isTriggered(triggerName: string): boolean;

  /**
   * Activates dynamic triggers by observing events with context.
   * Called before isTriggered to allow stateful triggers to transition.
   * Optional — only skills wrapping ActivatableTrigger implement this.
   *
   * @param triggerId - The name of the trigger event observed.
   * @param context - The fighting context providing killer card info.
   */
  activate?(triggerId: string, context: FightingContext): void;

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
