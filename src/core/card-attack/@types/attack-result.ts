import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';

export type AttackResult = {
  attack: DamageReport;
  status_change?: StatusChangeReport;
};
