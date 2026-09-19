import { AttackResult } from './attack-result';
import { BuffResult, DebuffResult } from './alteration-result';
import { HealingResult } from './healing-result';
import { ShieldResult } from './shield-result';
import { Stance } from '../stance/stance';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  alterationResults: (BuffResult | DebuffResult)[];
  shieldResults: ShieldResult[];
  /** Set when the special opened a stance on its caster. */
  stanceStarted?: Stance;
};
