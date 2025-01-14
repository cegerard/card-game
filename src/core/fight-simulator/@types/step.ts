import { DamageReport } from './damage-report';
import { StatusChangeReport } from './status-change-report';
import { WinnerReport } from './winner-report';

type StepKind =
  | 'fight_end'
  | 'status_change'
  | 'attack'
  | 'special_attack'
  | 'winner';

export type Step = { kind: StepKind } & (
  | StatusChangeReport
  | DamageReport
  | WinnerReport
);
