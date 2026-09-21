import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type RegeneratedReport = {
  kind: StepKind.Regenerated;
  card: CardInfo;
  healed: number;
  remainingHealth: number;
};
