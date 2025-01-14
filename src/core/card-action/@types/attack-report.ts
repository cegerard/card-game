import { DamageReport } from '../../fight-simulator/@types/damage-report';
import { StatusChangeReport } from '../../fight-simulator/@types/status-change-report';

export type AttackReport = {
  kind: string;
  attack: DamageReport;
  statusChanges: StatusChangeReport[];
};
