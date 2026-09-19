import { DamageReport } from './damage-report';
import { Step, StepKind } from './step';
import { BuffReport, DebuffReport } from './alteration-report';
import { ShieldAppliedReport } from './shield-report';
import { StanceStartedReport } from './stance-report';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  statusChanges: Step[];
  survivedSteps: Step[];
  buffReport?: BuffReport;
  debuffReport?: DebuffReport;
  shieldAppliedReport?: ShieldAppliedReport;
  stanceStartedReport?: StanceStartedReport;
};
