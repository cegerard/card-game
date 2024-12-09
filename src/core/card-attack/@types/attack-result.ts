import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';

type AttackReport = {
  attack: DamageReport;
  statusChanges: StatusChangeReport[];
};

type SpecialAttackReport = {
  specialAttack: DamageReport;
  statusChanges: StatusChangeReport[];
};

export type AttackResult = AttackReport | SpecialAttackReport;
