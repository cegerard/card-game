import { createFightingCard } from '../../../../../test/helpers/fighting-card';
import { ConditionalAttack } from '../../cards/skills/conditional-attack';
import { SimpleAttack } from '../../cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../cards/@types/damage/damage-composition';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { TargetedAll } from '../../targeting-card-strategies/targeted-all';
import { Trigger } from '../../trigger/trigger';
import { Step, StepKind } from '../@types/step';

/** A one-shot killer of every enemy, fired by `trigger`. */
export const executioner = (trigger: Trigger) =>
  createFightingCard({
    id: 'executioner',
    attack: 1000,
    accuracy: 9999,
    extraSkills: [
      new ConditionalAttack(
        'Coup fatal',
        new SimpleAttack(
          'Coup fatal',
          [new DamageComposition(DamageType.PHYSICAL, 1)],
          new TargetedAll(),
        ),
        new AlwaysTrueAttackCondition(),
        trigger,
      ),
    ],
  });

/** A fragile card that heals itself with its last breath. */
export const fragileWithLastBreath = () =>
  createFightingCard({
    id: 'victim',
    health: 1,
    defense: 0,
    agility: 0,
    skills: {
      others: [
        {
          effectRate: 0.1,
          trigger: 'self-death',
          targetCardId: 'victim',
          targetingStrategy: 'self',
        },
      ],
    },
  });

export const healingSources = (steps: Step[]): string[] =>
  steps.filter((s) => s.kind === StepKind.Healing).map((s: any) => s.source.id);
