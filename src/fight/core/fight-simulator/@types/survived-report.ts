import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type SurvivedReport = {
  kind: StepKind.Survived;
  name: string;
  card: CardInfo;
};
