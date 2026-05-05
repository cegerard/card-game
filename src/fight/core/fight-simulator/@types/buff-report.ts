import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type Buff = {
  target: CardInfo;
  kind: AlterationType;
  value: number;
  remainingTurns: number;
};

export type BuffReport = {
  kind: StepKind.Buff;
  name?: string;
  source: CardInfo;
  buffs: Buff[];
  energy: number;
  powerId?: string;
};
