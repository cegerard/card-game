import { FightingCard } from '../cards/fighting-card';
import {
  BattlefieldResult,
  LegacyResult,
} from '../cards/@types/battlefield/battlefield';
import { AttackResult } from '../cards/@types/action-result/attack-result';
import { Step, StepKind } from './@types/step';

/** The steps of a battlefield laid by `source`: start, revivals, then its alterations. */
export function battlefieldStartedSteps(
  source: FightingCard,
  result: BattlefieldResult,
): Step[] {
  const steps: Step[] = [
    {
      kind: StepKind.BattlefieldStarted,
      name: result.name,
      source: source.identityInfo,
      remainingTurns: result.remainingTurns,
    },
    ...result.revived.map(({ card, remainingHealth }): Step => ({
      kind: StepKind.Revived,
      name: result.name,
      source: source.identityInfo,
      card: card.identityInfo,
      remainingHealth,
    })),
  ];
  (['buff', 'debuff'] as const).forEach((polarity) => {
    const alterations = result.alterations.filter(
      (r) => r.alteration.polarity === polarity,
    );
    if (alterations.length === 0) return;

    steps.push({
      kind: polarity === 'buff' ? StepKind.Buff : StepKind.Debuff,
      name: result.name,
      source: source.identityInfo,
      alterations: alterations.map((r) => ({
        target: r.target,
        kind: r.alteration.type,
        value: r.alteration.value,
        remainingTurns: r.alteration.duration,
      })),
      energy: source.actualEnergy,
    });
  });

  return steps;
}

/** What a battlefield leaves when its caster falls under it. */
export function legacySteps(
  source: FightingCard,
  legacy: LegacyResult,
): Step[] {
  const steps: Step[] = [
    {
      kind: StepKind.BattlefieldExtended,
      name: legacy.name,
      source: source.identityInfo,
      extraTurns: legacy.extraTurns,
    },
  ];
  if (legacy.empowerment?.cards.length > 0) {
    steps.push({
      kind: StepKind.AttackEmpowered,
      name: legacy.empowerment.name,
      source: source.identityInfo,
      cards: legacy.empowerment.cards.map((card) => card.identityInfo),
    });
  }

  return steps;
}

/** The share of a hit the members of a damage sharing circle carried. */
export function damageSharedSteps(hit: AttackResult): Step[] {
  if (!hit.damageShared) return [];

  return [
    {
      kind: StepKind.DamageShared,
      name: hit.damageShared.name,
      card: hit.defender.identityInfo,
      shares: hit.damageShared.shares.map(({ card, damage }) => ({
        card: card.identityInfo,
        damage,
        remainingHealth: card.actualHealth,
      })),
    },
  ];
}
