import { AttackResult } from './attack-result';
import { BuffResult, DebuffResult } from './alteration-result';

export type NamedAttackResult = {
  name: string;
  results: AttackResult[];
  /** Alterations left on every defender the attack hit. */
  hitAlterations?: {
    name: string;
    buffs: BuffResult[];
    debuffs: DebuffResult[];
  };
};
