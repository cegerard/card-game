import { DamageReport } from '../../card-action/@types/damage-report';
import { StatusChangeReport } from '../../card-action/@types/status-change-report';
import { WinnerReport } from './winner-report';

export type Step = { kind: string } & (
  | StatusChangeReport
  | DamageReport
  | WinnerReport
);
