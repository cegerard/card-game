import type { HealingReport } from '@card-game/shared-types';
import { StepKind } from '@card-game/shared-types';
import { FightingCard } from '../cards/fighting-card';

/** A heal `card` received from a lasting effect of `source`, as a `healing` step. */
export function healingTickStep(
  card: FightingCard,
  tick: { name: string; source: FightingCard; healed: number },
): HealingReport {
  return {
    kind: StepKind.Healing,
    name: tick.name,
    source: tick.source.identityInfo,
    heal: [
      {
        target: card.identityInfo,
        healed: tick.healed,
        remainingHealth: card.actualHealth,
      },
    ],
    energy: tick.source.actualEnergy,
  };
}
