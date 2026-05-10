import { AttackResult } from './attack-result';
import { BuffResult, DebuffResult } from './alteration-result';
import { HealingResult } from './healing-result';
import { ShieldResult } from './shield-result';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  alterationResults: (BuffResult | DebuffResult)[];
  shieldResults: ShieldResult[];
};
