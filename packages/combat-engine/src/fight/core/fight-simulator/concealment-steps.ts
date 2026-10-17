import { Concealment } from '../cards/@types/concealment/concealment';
import { FightingCard } from '../cards/fighting-card';
import {
  ConcealmentEndReason,
  ConcealmentEndedReport,
  ConcealmentStartedReport,
} from './@types/concealment-report';
import { StepKind } from './@types/step';

export function concealmentStartedReport(
  card: FightingCard,
  concealment: Concealment,
): ConcealmentStartedReport {
  return {
    kind: StepKind.ConcealmentStarted,
    name: concealment.name,
    card: card.identityInfo,
    remainingTurns: concealment.remainingTurns,
  };
}

export function concealmentEndedReport(
  card: FightingCard,
  concealment: Concealment,
  reason: ConcealmentEndReason,
): ConcealmentEndedReport {
  return {
    kind: StepKind.ConcealmentEnded,
    name: concealment.name,
    card: card.identityInfo,
    reason,
  };
}

/**
 * Lifts the concealment of a card that just attacked somebody, and reports it
 * when there was one to lift.
 */
export function revealAttacker(card: FightingCard): ConcealmentEndedReport[] {
  const broken = card.breakConcealment();

  return broken ? [concealmentEndedReport(card, broken, 'attacked')] : [];
}
