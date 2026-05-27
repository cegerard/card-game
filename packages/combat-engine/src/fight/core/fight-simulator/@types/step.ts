import { BuffReport, DebuffReport } from './alteration-report';
import { AttackStepReport, SpecialAttackStepReport } from './damage-report';
import { HealingReport } from './healing-report';
import { StateEffectReport } from './state-effect-report';
import { StatusChangeReport } from './status-change-report';
import { WinnerReport } from './winner-report';
import {
  BuffRemovedReport,
  DebuffRemovedReport,
} from './alteration-removed-report';
import {
  BuffExpiredReport,
  DebuffExpiredReport,
} from './alteration-expired-report';
import {
  TargetingOverrideReport,
  TargetingRevertedReport,
} from './targeting-override-report';
import { EffectRemovedReport } from './effect-removed-report';
import {
  ShieldAppliedReport,
  ShieldBrokenReport,
  ShieldExpiredReport,
} from './shield-report';
import { SurvivedReport } from './survived-report';

export enum StepKind {
  FightEnd = 'fight_end',
  StatusChange = 'status_change',
  Attack = 'attack',
  SpecialAttack = 'special_attack',
  Healing = 'healing',
  StateEffect = 'state_effect',
  Buff = 'buff',
  Debuff = 'debuff',
  BuffRemoved = 'buff_removed',
  DebuffRemoved = 'debuff_removed',
  BuffExpired = 'buff_expired',
  DebuffExpired = 'debuff_expired',
  TargetingOverride = 'targeting_override',
  TargetingReverted = 'targeting_reverted',
  EffectRemoved = 'effect_removed',
  ShieldApplied = 'shield_applied',
  ShieldBroken = 'shield_broken',
  ShieldExpired = 'shield_expired',
  Survived = 'survived',
}

export type Step =
  | StatusChangeReport
  | AttackStepReport
  | SpecialAttackStepReport
  | HealingReport
  | WinnerReport
  | StateEffectReport
  | BuffReport
  | DebuffReport
  | BuffRemovedReport
  | DebuffRemovedReport
  | BuffExpiredReport
  | DebuffExpiredReport
  | TargetingOverrideReport
  | TargetingRevertedReport
  | EffectRemovedReport
  | ShieldAppliedReport
  | ShieldBrokenReport
  | ShieldExpiredReport
  | SurvivedReport;
