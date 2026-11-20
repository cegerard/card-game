import type { Damage, Step } from '@card-game/shared-types';
import { StepKind } from '@card-game/shared-types';
import { FightingCard } from '../cards/fighting-card';
import { AttackResult } from '../cards/@types/action-result/attack-result';
import { ExecutionResult } from '../cards/@types/action-result/execution-result';
import { damageSharedSteps } from './battlefield-steps';
import { executionSteps } from './execution-steps';
import type { SurvivedReactor } from './survived-reactions';

/*
 * The steps one hit leaves, shared by every attack path: the action of a card
 * (ActionStage) and the attacks its skills launch (skillResultsToSteps).
 */

/** The line one hit takes in its attack step. */
export function hitDamage(hit: AttackResult): Damage {
  return {
    defender: hit.defender.identityInfo,
    damage: hit.damage,
    isCritical: hit.isCritical,
    dodge: hit.dodge,
    remainingHealth: hit.remainingHealth,
    kind: hit.kind,
    shieldAbsorbed: hit.shieldAbsorbed,
    consumedBleedStacks: hit.consumedBleedStacks,
  };
}

/**
 * What happened to one hit on its way to the health pool, in the order of
 * the damage layers: the reduction, the share a circle carried followed by
 * `carriersReactions` (what the carriers did on feeling it), the shield it
 * broke.
 */
export function defenseSteps(
  hit: AttackResult,
  carriersReactions: (hit: AttackResult) => Step[] = () => [],
): Step[] {
  return [
    ...(hit.mitigated
      ? [
          {
            kind: StepKind.DamageMitigated,
            name: hit.mitigatedSkillName,
            card: hit.defender.identityInfo,
          },
        ]
      : []),
    ...damageSharedSteps(hit),
    ...carriersReactions(hit),
    ...(hit.shieldBroken
      ? [{ kind: StepKind.ShieldBroken, card: hit.defender.identityInfo }]
      : []),
  ];
}

/** The SURVIVE that held a fatal hit, then what its holder did on it. */
export function survivedSteps(
  hit: AttackResult,
  survivedReactor?: SurvivedReactor,
): Step[] {
  if (!hit.survived) return [];

  return [
    {
      kind: StepKind.Survived,
      name: hit.survivedSkillName,
      card: hit.defender.identityInfo,
    },
    ...(survivedReactor?.(hit.defender) ?? []),
  ];
}

/** Each execution of an attack, followed by what a SURVIVE holder did on it. */
export function executionReactionSteps(
  attacker: FightingCard,
  name: string,
  executions: ExecutionResult[],
  survivedReactor?: SurvivedReactor,
): Step[] {
  return executions.flatMap((execution) => [
    ...executionSteps(attacker, name, [execution]),
    ...(execution.survived ? (survivedReactor?.(execution.card) ?? []) : []),
  ]);
}

export function deathStep(card: FightingCard): Step {
  return {
    kind: StepKind.StatusChange,
    card: card.identityInfo,
    status: 'dead',
  };
}
