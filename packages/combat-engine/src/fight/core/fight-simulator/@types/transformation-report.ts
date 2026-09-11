import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type TransformationStartedReport = {
  kind: StepKind.TransformationStarted;
  name: string;
  card: CardInfo;
  remainingTurns: number;
};

export type TransformationEndedReport = {
  kind: StepKind.TransformationEnded;
  name: string;
  card: CardInfo;
};
