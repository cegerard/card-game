import { DamageReport } from '../../card-attack/@types/damage-report';
import { StatusChangeReport } from '../../card-attack/@types/status-change-report';
import { WinnerReport } from './winner-report';

export type Step = { kind: string } & (
  | StatusChangeReport
  | DamageReport
  | WinnerReport
);
