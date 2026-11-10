import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type BattlefieldStartedReport = {
  kind: StepKind.BattlefieldStarted;
  name: string;
  source: CardInfo;
  remainingTurns: number;
};

export type BattlefieldExtendedReport = {
  kind: StepKind.BattlefieldExtended;
  name: string;
  source: CardInfo;
  extraTurns: number;
};

export type BattlefieldEndedReport = {
  kind: StepKind.BattlefieldEnded;
  name: string;
  card: CardInfo;
};

export type RevivedReport = {
  kind: StepKind.Revived;
  name: string;
  source: CardInfo;
  card: CardInfo;
  remainingHealth: number;
};

export type AttackEmpoweredReport = {
  kind: StepKind.AttackEmpowered;
  name: string;
  source: CardInfo;
  cards: CardInfo[];
};
