import { CardInfo } from '../../cards/@types/card-info';
import { WeakPointEndReason } from '../../cards/@types/weak-point/weak-point';
import { StepKind } from './step';

export type WeakPointRevealedReport = {
  kind: StepKind.WeakPointRevealed;
  name: string;
  /** The card that revealed it. */
  source: CardInfo;
  card: CardInfo;
  /** Absent: it never expires. */
  remainingTurns?: number;
};

export type WeakPointEndedReport = {
  kind: StepKind.WeakPointEnded;
  name: string;
  card: CardInfo;
  reason: WeakPointEndReason;
};

export type AnalysisChargedReport = {
  kind: StepKind.AnalysisCharged;
  name: string;
  source: CardInfo;
  card: CardInfo;
  charges: number;
};
