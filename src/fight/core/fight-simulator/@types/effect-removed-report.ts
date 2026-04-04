import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type EffectRemovedReport = {
  kind: StepKind.EffectRemoved;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; effectType: string }[];
};
