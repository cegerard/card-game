import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type AlterationReport<K extends StepKind> = {
  kind: K;
  name?: string;
  source: CardInfo;
  alterations: {
    target: CardInfo;
    kind: AlterationType;
    value: number;
    remainingTurns: number;
  }[];
  energy: number;
  powerId?: string;
};

export type BuffReport = AlterationReport<StepKind.Buff>;
export type DebuffReport = AlterationReport<StepKind.Debuff>;
