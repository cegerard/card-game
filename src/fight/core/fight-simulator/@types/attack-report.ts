import { DamageReport } from './damage-report';
import { Step, StepKind } from './step';
import { BuffReport, DebuffReport } from './alteration-report';
import { ShieldAppliedReport } from './shield-report';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  statusChanges: Step[];
  buffReport?: BuffReport;
  debuffReport?: DebuffReport;
  shieldAppliedReport?: ShieldAppliedReport;
};
