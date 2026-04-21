import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type TargetingOverrideReport = {
  kind: StepKind.TargetingOverride;
  name?: string;
  source: CardInfo;
  previousStrategy: string;
  newStrategy: string;
  powerId?: string;
};

export type TargetingRevertedReport = {
  kind: StepKind.TargetingReverted;
  source: CardInfo;
  eventName: string;
  revertedStrategy: string;
  restoredStrategy: string;
  powerId?: string;
};
