import { BuffType } from '../../cards/@types/buff/type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type BuffRemovedReport = {
  kind: StepKind.BuffRemoved;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; kind: BuffType; value: number }[];
  powerId?: string;
};
