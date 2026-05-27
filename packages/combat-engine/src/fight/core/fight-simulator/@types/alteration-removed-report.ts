import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type AlterationRemovedReport<K extends StepKind> = {
  kind: K;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; kind: AlterationType; value: number }[];
  powerId?: string;
};

export type BuffRemovedReport = AlterationRemovedReport<StepKind.BuffRemoved>;
export type DebuffRemovedReport =
  AlterationRemovedReport<StepKind.DebuffRemoved>;
