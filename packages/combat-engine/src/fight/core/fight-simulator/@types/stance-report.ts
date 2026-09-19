import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type StanceStartedReport = {
  kind: StepKind.StanceStarted;
  name: string;
  card: CardInfo;
  remainingTurns: number;
};

export type StanceEndedReport = {
  kind: StepKind.StanceEnded;
  name: string;
  card: CardInfo;
};
