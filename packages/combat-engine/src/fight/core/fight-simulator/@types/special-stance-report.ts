import type { SpecialStanceReport, Step } from '@card-game/shared-types';
import { StepKind } from './step';

/** The special step, followed by everything the stance brought. */
export type SpecialStanceActionReport = {
  kind: StepKind.SpecialStance;
  step: SpecialStanceReport;
  followUps: Step[];
};
