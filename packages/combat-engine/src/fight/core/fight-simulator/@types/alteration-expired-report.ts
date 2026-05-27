import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type AlterationExpiredReport<K extends StepKind> = {
  kind: K;
  card: CardInfo;
  expired: { kind: AlterationType; value: number }[];
};

export type BuffExpiredReport = AlterationExpiredReport<StepKind.BuffExpired>;
export type DebuffExpiredReport =
  AlterationExpiredReport<StepKind.DebuffExpired>;
