import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type DamageMitigatedReport = {
  kind: StepKind.DamageMitigated;
  name: string;
  card: CardInfo;
};
