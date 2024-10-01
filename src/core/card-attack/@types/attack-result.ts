import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';

type AttackReport = {
  attack: DamageReport;
  statusChange?: StatusChangeReport;
};

type SpecialAttackReport = {
  specialAttack: DamageReport;
  statusChange?: StatusChangeReport;
};

export type AttackResult = AttackReport | SpecialAttackReport;
