import type {
  BuffReport,
  ConcealmentEndedReport,
  DamageReport,
  DebuffReport,
  ShieldAppliedReport,
  StanceEndedReport,
  StanceStartedReport,
  Step,
} from '@card-game/shared-types';
import { StepKind } from './step';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  /** Reported before the attack: what fired next to it and took no strike. */
  precedingSteps?: Step[];
  statusChanges: Step[];
  survivedSteps: Step[];
  /** Defenders the attack executed, with SURVIVE interceptions. */
  executionSteps?: Step[];
  /** Alterations the attack left on the defenders it hit. */
  hitAlterationSteps?: Step[];
  /** A battlefield the attack laid, with what it brought. */
  battlefieldSteps?: Step[];
  /** Event-bound buffs and effects released by a skill this attack exhausted. */
  endEventSteps?: Step[];
  buffReport?: BuffReport;
  debuffReport?: DebuffReport;
  shieldAppliedReport?: ShieldAppliedReport;
  stanceStartedReport?: StanceStartedReport;
  stanceEndedReport?: StanceEndedReport;
  concealmentEndedReports: ConcealmentEndedReport[];
};
