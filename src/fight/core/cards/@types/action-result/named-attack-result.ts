import { AttackResult } from './attack-result';

export type NamedAttackResult = {
  name: string;
  results: AttackResult[];
};
