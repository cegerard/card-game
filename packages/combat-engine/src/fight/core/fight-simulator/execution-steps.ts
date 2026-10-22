import { FightingCard } from '../cards/fighting-card';
import { ExecutionResult } from '../cards/@types/action-result/execution-result';
import { Step, StepKind } from './@types/step';

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
            kind: StepKind.Survived as const,
            name: survivedSkillName,
            card: card.identityInfo,
          },
        ]
      : []),
  ]);
}
