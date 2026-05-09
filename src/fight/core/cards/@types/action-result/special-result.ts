import { AttackResult } from './attack-result';
import { BuffResult } from './alteration-result';
import { HealingResult } from './healing-result';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  buffResults: BuffResult[];
};
