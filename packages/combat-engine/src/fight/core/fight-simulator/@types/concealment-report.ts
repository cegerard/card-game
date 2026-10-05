import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type ConcealmentStartedReport = {
  kind: StepKind.ConcealmentStarted;
  name: string;
  card: CardInfo;
  /** Absent for a concealment lasting until the card attacks. */
  remainingTurns?: number;
};

export type ConcealmentEndReason = 'attacked' | 'expired';

export type ConcealmentEndedReport = {
  kind: StepKind.ConcealmentEnded;
  name: string;
  card: CardInfo;
  reason: ConcealmentEndReason;
};
