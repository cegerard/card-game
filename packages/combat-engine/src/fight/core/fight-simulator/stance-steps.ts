import { Stance } from '../cards/@types/stance/stance';
import { FightingCard } from '../cards/fighting-card';
import { StanceStartedReport } from './@types/stance-report';
import { StepKind } from './@types/step';

export function stanceStartedReport(
  card: FightingCard,
  stance: Stance,
): StanceStartedReport {
  return {
    kind: StepKind.StanceStarted,
    name: stance.name,
    card: card.identityInfo,
    remainingTurns: stance.remainingTurns,
  };
}
