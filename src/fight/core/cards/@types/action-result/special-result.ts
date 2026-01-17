import { AttackResult } from './attack-result';
import { BuffResults } from './buff-results';
import { HealingResult } from './healing-result';

export type SpecialResult = {
  actionResults: AttackResult[] | HealingResult[];
  buffResults: BuffResults;
};
