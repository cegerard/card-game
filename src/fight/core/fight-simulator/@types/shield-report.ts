import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type ShieldAppliedReport = {
  kind: StepKind.ShieldApplied;
  name?: string;
  source: CardInfo;
  targets: { target: CardInfo; points: number }[];
};

export type ShieldBrokenReport = {
  kind: StepKind.ShieldBroken;
  card: CardInfo;
};

export type ShieldExpiredReport = {
  kind: StepKind.ShieldExpired;
  card: CardInfo;
};
