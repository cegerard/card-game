import { BuffReport } from './buff-report';
import { DebuffReport } from './debuff-report';
import { DamageReport } from './damage-report';
import { HealingReport } from './healing-report';
import { StateEffectReport } from './state-effect-report';
import { StatusChangeReport } from './status-change-report';
import { WinnerReport } from './winner-report';
import { BuffRemovedReport } from './buff-removed-report';
import {
  TargetingOverrideReport,
  TargetingRevertedReport,
} from './targeting-override-report';
import { EffectRemovedReport } from './effect-removed-report';

export enum StepKind {
  FightEnd = 'fight_end',
  StatusChange = 'status_change',
  Attack = 'attack',
  SpecialAttack = 'special_attack',
  Healing = 'healing',
  Winner = 'winner',
  StateEffect = 'state_effect',
  Buff = 'buff',
  Debuff = 'debuff',
  BuffRemoved = 'buff_removed',
  TargetingOverride = 'targeting_override',
  TargetingReverted = 'targeting_reverted',
  EffectRemoved = 'effect_removed',
}

export type Step =
  | ({ kind: StepKind.StatusChange } & StatusChangeReport)
  | ({ kind: StepKind.Attack } & DamageReport)
  | ({ kind: StepKind.SpecialAttack } & DamageReport)
  | HealingReport
  | ({ kind: StepKind.FightEnd } & WinnerReport)
  | ({ kind: StepKind.StateEffect } & StateEffectReport)
  | BuffReport
  | DebuffReport
  | BuffRemovedReport
  | TargetingOverrideReport
  | TargetingRevertedReport
  | EffectRemovedReport;
