import { CardInfo } from '../../cards/@types/card-info';
import { StateEffectType } from '../../cards/@types/state/state-effect-type';
import { StepKind } from './step';

export type EffectRemovedReport = {
  kind: StepKind.EffectRemoved;
  source: CardInfo;
  eventName: string;
  removed: { target: CardInfo; effectType: StateEffectType }[];
};
