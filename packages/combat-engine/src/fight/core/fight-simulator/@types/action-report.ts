import { AttackReport } from './attack-report';
import { HealingReport } from './healing-report';
import { SpecialStanceActionReport } from './special-stance-report';
import { Step } from './step';

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
