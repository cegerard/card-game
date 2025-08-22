import { BuffType } from '../../cards/@types/buff/buff-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type Buff = {
  target: CardInfo;
  kind: BuffType;
  value: number;
  remainingTurns: number;
};

export type BuffReport = {
  kind: StepKind.Buff;
  source: CardInfo;
  buffs: Buff[];
};
