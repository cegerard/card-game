import { createFightingCard } from './fighting-card';
import { ConditionalAttack } from '../../src/fight/core/cards/skills/conditional-attack';
import { SimpleAttack } from '../../src/fight/core/cards/skills/simple-attack';
import { AlwaysTrueAttackCondition } from '../../src/fight/core/cards/@types/attack/conditions/always-true-attack-condition';
import { DamageComposition } from '../../src/fight/core/cards/@types/damage/damage-composition';
import { DamageType } from '../../src/fight/core/cards/@types/damage/damage-type';
import { TargetedAll } from '../../src/fight/core/targeting-card-strategies/targeted-all';
import { Trigger } from '../../src/fight/core/trigger/trigger';
import {
  Step,
  StepKind,
} from '../../src/fight/core/fight-simulator/@types/step';

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
