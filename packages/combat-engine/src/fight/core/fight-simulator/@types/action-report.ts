import type { HealingReport, Step } from '@card-game/shared-types';
import { AttackReport } from './attack-report';
import { SpecialStanceActionReport } from './special-stance-report';

export const SKILL_STEPS = 'skill_steps';

/** An action a skill took in place of the attack, reported by its own steps. */
export type SkillStepsActionReport = {
  kind: typeof SKILL_STEPS;
  steps: Step[];
};

export type ActionReport =
  | AttackReport
  | HealingReport
  | SpecialStanceActionReport
  | SkillStepsActionReport;
