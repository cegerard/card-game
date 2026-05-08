import { AttackResult } from './attack-result';
import { BuffResults } from './alteration-result';
import { HealingResult } from './healing-result';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  buffResults: BuffResults;
};
