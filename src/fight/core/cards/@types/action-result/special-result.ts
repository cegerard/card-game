import { AttackResult } from './attack-result';
import { BuffResults } from './buff-results';
import { HealingResult } from './healing-result';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  buffResults: BuffResults;
};
