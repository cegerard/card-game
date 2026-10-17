import { AttackReport } from './attack-report';
import { HealingReport } from './healing-report';
import { SpecialStanceActionReport } from './special-stance-report';

export type ActionReport =
  AttackReport | HealingReport | SpecialStanceActionReport;
