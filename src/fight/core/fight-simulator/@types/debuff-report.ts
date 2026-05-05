import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type Debuff = {
  target: CardInfo;
  kind: AlterationType;
  value: number;
  remainingTurns: number;
};

export type DebuffReport = {
  kind: StepKind.Debuff;
  name?: string;
  source: CardInfo;
  debuffs: Debuff[];
  energy: number;
  powerId?: string;
};
