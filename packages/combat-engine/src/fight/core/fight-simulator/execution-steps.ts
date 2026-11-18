import type { Step } from '@card-game/shared-types';
import { StepKind } from '@card-game/shared-types';
import { FightingCard } from '../cards/fighting-card';
import { ExecutionResult } from '../cards/@types/action-result/execution-result';

/** An `executed` step per defender, followed by `survived` when SURVIVE held. */
export function executionSteps(
  attacker: FightingCard,
  name: string,
  executions: ExecutionResult[],
): Step[] {
  return executions.flatMap(({ card, survived, survivedSkillName }): Step[] => [
    {
      kind: StepKind.Executed,
      name,
      attacker: attacker.identityInfo,
      card: card.identityInfo,
    },
    ...(survived
      ? [
          {
            kind: StepKind.Survived,
            name: survivedSkillName,
            card: card.identityInfo,
          },
        ]
      : []),
  ]);
}
