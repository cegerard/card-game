import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';
import { StepKind } from './step';

export type AttackReport = {
  kind: StepKind.Attack | StepKind.SpecialAttack;
  attack: DamageReport;
  statusChanges: StatusChangeReport[];
};
