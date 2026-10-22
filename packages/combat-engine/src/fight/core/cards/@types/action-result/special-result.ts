import { AttackResult } from './attack-result';
import { BuffResult, DebuffResult } from './alteration-result';
import { HealingResult } from './healing-result';
import { ShieldResult } from './shield-result';
import { Stance } from '../stance/stance';
import { Concealment } from '../concealment/concealment';
import { ExecutionResult } from './execution-result';

export type SpecialResult = {
  name: string;
  actionResults: AttackResult[] | HealingResult[];
  alterationResults: (BuffResult | DebuffResult)[];
  shieldResults: ShieldResult[];
  /** Set when the special opened a stance on its caster. */
  stanceStarted?: Stance;
  /** Energy the caster keeps instead of emptying its gauge. */
  energyRefund?: number;
  /** Defenders the special finished off under its execution threshold. */
  executions?: ExecutionResult[];
  /** Set when the special concealed its caster. */
  concealmentStarted?: Concealment;
};
