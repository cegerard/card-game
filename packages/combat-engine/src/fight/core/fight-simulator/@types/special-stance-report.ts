import { CardInfo } from '../../cards/@types/card-info';
import { Step, StepKind } from './step';

/** A special that struck nobody: its caster only entered a stance. */
export type SpecialStanceReport = {
  kind: StepKind.SpecialStance;
  name: string;
  caster: CardInfo;
  energy: number;
};

/** The special step, followed by everything the stance brought. */
export type SpecialStanceActionReport = {
  kind: StepKind.SpecialStance;
  step: SpecialStanceReport;
  followUps: Step[];
};
