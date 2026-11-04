import { ExecutionResult } from '../@types/action-result/execution-result';
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
import { ShieldResult } from '../@types/action-result/shield-result';
import { ProtectionResult } from './protection';
import { Stance } from '../@types/stance/stance';
import { Concealment } from '../@types/concealment/concealment';
import { Buff } from '../@types/alteration/alteration-detail';
import { EffectResult } from '../@types/attack/attack-effect';

export enum SkillKind {
  Healing = 'healing',
  Buff = 'buff',
  Debuff = 'debuff',
  Attack = 'attack',
  TargetingOverride = 'targeting_override',
  Shield = 'shield',
  Transformation = 'transformation',
  Protection = 'protection',
  Stance = 'stance',
  Concealment = 'concealment',
  BuffTransfer = 'buff_transfer',
  Affliction = 'affliction',
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
  /** A secondary strike around the primary target, reported on its own. */
  splash?: { name: string; results: AttackResult[] };
  /** Defenders the main attack finished off under its execution threshold. */
  executions?: { name: string; results: ExecutionResult[] };
  /** Alterations left on every defender the main attack hit. */
  hitAlterations?: {
    name: string;
    buffs: BuffResult[];
    debuffs: DebuffResult[];
  };
  /** Debuffs the primary target got for being left under a health threshold. */
  lowHealthDebuff?: { name: string; results: DebuffResult[] };
  /** The stance the attack opened on its owner when it fired. */
  stanceStarted?: Stance;
  /** The stance the attack closed on its owner when it fired. */
  stanceEnded?: string;
};

export type TargetingOverrideSkillResults = BaseSkillResults & {
  skillKind: SkillKind.TargetingOverride;
  results: TargetingOverrideReport[];
};

export type ShieldSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Shield;
  results: ShieldResult[];
};

export type TransformationSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Transformation;
  results: (BuffResult | DebuffResult)[];
  remainingTurns: number;
  stancesStarted?: Stance[];
  /** Cards whose stacked poison the transformation surged. */
  poisonSurged?: FightingCard[];
};

export type ProtectionSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Protection;
  results: ProtectionResult[];
};

export type BuffTransferSkillResults = BaseSkillResults & {
  skillKind: SkillKind.BuffTransfer;
  /** At most one: the card that received the buffs, empty when none moved. */
  results: { target: FightingCard; buffs: Buff[] }[];
};

export type AfflictionSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Affliction;
  results: EffectResult[];
};

export type StanceSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Stance;
  /** Absent when the skill chance did not fire. */
  stance?: Stance;
  alterations?: (BuffResult | DebuffResult)[];
};

export type ConcealmentSkillResults = BaseSkillResults & {
  skillKind: SkillKind.Concealment;
  concealment: Concealment;
  /** The stance the concealment opened on its owner. */
  stanceStarted?: Stance;
};

export type SkillResults =
  | HealingSkillResults
  | BuffSkillResults
  | DebuffSkillResults
  | AttackSkillResults
  | TargetingOverrideSkillResults
  | ShieldSkillResults
  | TransformationSkillResults
  | ProtectionSkillResults
  | StanceSkillResults
  | BuffTransferSkillResults
  | AfflictionSkillResults
  | ConcealmentSkillResults;

export interface Skill {
  id: string;
  name: string;

  /**
   * Name of the stance this skill needs to be active on its owner. Set, the
   * skill never fires outside that stance, which is how an ability lasts only
   * as long as the power that granted it.
   */
  readonly requiredStance?: string;

  /**
   * Set, the skill never fires when its owner lost health since the start of
   * its previous action. Gated like `requiredStance`, so a blocked skill is
   * never launched and keeps its cooldown.
   */
  readonly requiresUndamaged?: boolean;

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
