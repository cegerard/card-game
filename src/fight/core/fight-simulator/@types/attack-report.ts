import { DamageReport } from './damage-report';
import { Step, StepKind } from './step';
import { BuffReport } from './buff-report';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  statusChanges: Step[];
  buffReport?: BuffReport;
};
