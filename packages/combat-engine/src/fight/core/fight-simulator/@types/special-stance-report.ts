import type { SpecialStanceReport, Step } from '@card-game/shared-types';
import { StepKind } from '@card-game/shared-types';

/** The special step, followed by everything the stance brought. */
export type SpecialStanceActionReport = {
  kind: typeof StepKind.SpecialStance;
  step: SpecialStanceReport;
  followUps: Step[];
};
