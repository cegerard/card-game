import { DebuffType } from '../../cards/@types/alteration/type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type DebuffExpiredReport = {
  kind: StepKind.DebuffExpired;
  card: CardInfo;
  expired: { kind: DebuffType; value: number }[];
};
