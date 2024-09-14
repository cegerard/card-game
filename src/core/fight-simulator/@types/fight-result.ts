import { DamageReport } from '../../card-attack/@types/damage-report';
import { StatusChangeReport } from '../../card-attack/@types/status-change-report';
import { WinnerReport } from './winner-report';

export type StepKind = 'fight_end' | 'status_change' | 'attack' | 'winner';

export type FightResult = {
  [step: number]: { kind: string } & (
    | StatusChangeReport
    | DamageReport
    | WinnerReport
  );
};
