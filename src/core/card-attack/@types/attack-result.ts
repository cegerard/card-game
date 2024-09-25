import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';

type AttackReport = {
  attack: DamageReport;
  status_change?: StatusChangeReport;
};

type SpecialAttackReport = {
  specialAttack: DamageReport;
  status_change?: StatusChangeReport;
};

export type AttackResult = AttackReport | SpecialAttackReport;
