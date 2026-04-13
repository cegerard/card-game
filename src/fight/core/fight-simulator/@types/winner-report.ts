import { StepKind } from './step';

export type WinnerReport = {
  kind: StepKind.FightEnd;
  winner: string | null;
};
