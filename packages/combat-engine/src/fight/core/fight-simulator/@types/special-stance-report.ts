import type { SpecialStanceReport } from '@card-game/shared-types';
import { Step, StepKind } from './step';

export type { SpecialStanceReport };

/** The special step, followed by everything the stance brought. */
export type SpecialStanceActionReport = {
  kind: StepKind.SpecialStance;
  step: SpecialStanceReport;
  followUps: Step[];
};
