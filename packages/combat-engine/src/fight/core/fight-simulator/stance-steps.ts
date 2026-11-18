import type {
  StanceEndedReport,
  StanceStartedReport,
} from '@card-game/shared-types';
import { StepKind } from '@card-game/shared-types';
import { Stance } from '../cards/@types/stance/stance';
import { FightingCard } from '../cards/fighting-card';

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

export function stanceEndedReport(
  card: FightingCard,
  name: string,
): StanceEndedReport {
  return { kind: StepKind.StanceEnded, name, card: card.identityInfo };
}
