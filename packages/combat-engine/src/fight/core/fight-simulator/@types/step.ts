import { ExecutedReport } from './executed-report';
import { BuffTransferredReport } from './buff-transferred-report';
import { BuffReport, DebuffReport } from './alteration-report';
import { AttackStepReport, SpecialAttackStepReport } from './damage-report';
import { HealingReport } from './healing-report';
import { StateEffectReport } from './state-effect-report';
import { StatusChangeReport } from './status-change-report';
import { WinnerReport } from './winner-report';
import { FightStartReport } from './fight-start-report';
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
import { DamageMitigatedReport } from './damage-mitigated-report';
import { StanceStartedReport, StanceEndedReport } from './stance-report';
import { MarkAppliedReport } from './mark-report';
import { RegeneratedReport } from './regeneration-report';
import {
  ProtectionStartedReport,
  ProtectionEndedReport,
  AttackInterceptedReport,
} from './protection-report';
import {
  TransformationStartedReport,
  TransformationEndedReport,
} from './transformation-report';
import { SpecialStanceReport } from './special-stance-report';
import {
  ConcealmentStartedReport,
  ConcealmentEndedReport,
} from './concealment-report';
import {
  AnalysisChargedReport,
  WeakPointEndedReport,
  WeakPointRevealedReport,
} from './weak-point-report';
import {
  AttackEmpoweredReport,
  BattlefieldEndedReport,
  BattlefieldExtendedReport,
  BattlefieldStartedReport,
  RevivedReport,
} from './battlefield-report';
import {
  DamageSharedReport,
  EffectCleansedReport,
  EnergyGainedReport,
} from './support-report';

export enum StepKind {
  FightStart = 'fight_start',
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
  DamageMitigated = 'damage_mitigated',
  StanceStarted = 'stance_started',
  StanceEnded = 'stance_ended',
  MarkApplied = 'mark_applied',
  Regenerated = 'regenerated',
  ProtectionStarted = 'protection_started',
  ProtectionEnded = 'protection_ended',
  AttackIntercepted = 'attack_intercepted',
  TransformationStarted = 'transformation_started',
  TransformationEnded = 'transformation_ended',
  ConcealmentStarted = 'concealment_started',
  ConcealmentEnded = 'concealment_ended',
  SpecialStance = 'special_stance',
  Executed = 'executed',
  BuffTransferred = 'buff_transferred',
  WeakPointRevealed = 'weak_point_revealed',
  WeakPointEnded = 'weak_point_ended',
  AnalysisCharged = 'analysis_charged',
  BattlefieldStarted = 'battlefield_started',
  BattlefieldExtended = 'battlefield_extended',
  BattlefieldEnded = 'battlefield_ended',
  Revived = 'revived',
  AttackEmpowered = 'attack_empowered',
  DamageShared = 'damage_shared',
  EnergyGained = 'energy_gained',
  EffectCleansed = 'effect_cleansed',
}

export type Step =
  | StatusChangeReport
  | AttackStepReport
  | SpecialAttackStepReport
  | HealingReport
  | FightStartReport
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
  | SurvivedReport
  | DamageMitigatedReport
  | StanceStartedReport
  | StanceEndedReport
  | MarkAppliedReport
  | RegeneratedReport
  | ProtectionStartedReport
  | ProtectionEndedReport
  | AttackInterceptedReport
  | TransformationStartedReport
  | TransformationEndedReport
  | ConcealmentStartedReport
  | ConcealmentEndedReport
  | SpecialStanceReport
  | ExecutedReport
  | BuffTransferredReport
  | WeakPointRevealedReport
  | WeakPointEndedReport
  | AnalysisChargedReport
  | BattlefieldStartedReport
  | BattlefieldExtendedReport
  | BattlefieldEndedReport
  | RevivedReport
  | AttackEmpoweredReport
  | DamageSharedReport
  | EnergyGainedReport
  | EffectCleansedReport;
