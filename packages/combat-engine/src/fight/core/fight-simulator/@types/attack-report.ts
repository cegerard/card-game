import { DamageReport } from './damage-report';
import { Step, StepKind } from './step';
import { BuffReport, DebuffReport } from './alteration-report';
import { ShieldAppliedReport } from './shield-report';
import { StanceEndedReport, StanceStartedReport } from './stance-report';
import { ConcealmentEndedReport } from './concealment-report';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  statusChanges: Step[];
  survivedSteps: Step[];
  /** Alterations the attack left on the defenders it hit. */
  hitAlterationSteps?: Step[];
  buffReport?: BuffReport;
  debuffReport?: DebuffReport;
  shieldAppliedReport?: ShieldAppliedReport;
  stanceStartedReport?: StanceStartedReport;
  stanceEndedReport?: StanceEndedReport;
  concealmentEndedReports: ConcealmentEndedReport[];
};
