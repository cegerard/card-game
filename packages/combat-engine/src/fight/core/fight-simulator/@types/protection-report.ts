import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type ProtectionStartedReport = {
  kind: StepKind.ProtectionStarted;
  name: string;
  card: CardInfo;
  protectedCard: CardInfo;
  remainingTurns: number;
};

export type ProtectionEndedReport = {
  kind: StepKind.ProtectionEnded;
  card: CardInfo;
  protectedCard: CardInfo;
};

export type AttackInterceptedReport = {
  kind: StepKind.AttackIntercepted;
  card: CardInfo;
  protectedCard: CardInfo;
};
