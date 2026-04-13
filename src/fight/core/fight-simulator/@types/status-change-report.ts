import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type status = 'dead' | 'poison' | 'burn' | 'freeze';

export type StatusChangeReport = {
  kind: StepKind.StatusChange;
  card: CardInfo;
  status: status;
};
