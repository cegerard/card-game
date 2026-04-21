import { DebuffType } from '../../cards/@types/buff/type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type Debuff = {
  target: CardInfo;
  kind: DebuffType;
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
