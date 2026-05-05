import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type DebuffRemovedReport = {
  kind: StepKind.DebuffRemoved;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; kind: AlterationType; value: number }[];
  powerId?: string;
};
