import { BuffReport } from './buff-report';
import { DebuffReport } from './debuff-report';
import { DamageReport } from './damage-report';
import { HealingReport } from './healing-report';
import { StateEffectReport } from './state-effect-report';
import { StatusChangeReport } from './status-change-report';
import { WinnerReport } from './winner-report';
import { BuffRemovedReport } from './buff-removed-report';

export enum StepKind {
  FightEnd = 'fight_end',
  StatusChange = 'status_change',
  Attack = 'attack',
  SpecialAttack = 'special_attack',
  Healing = 'healing',
  Winner = 'winner',
  StateEffect = 'state_effect',
  Buff = 'buff',
  Debuff = 'debuff',
  BuffRemoved = 'buff_removed',
}

export type Step = { kind: StepKind } & (
  | StatusChangeReport
  | DamageReport
  | HealingReport
  | WinnerReport
  | StateEffectReport
  | BuffReport
  | DebuffReport
  | BuffRemovedReport
);
