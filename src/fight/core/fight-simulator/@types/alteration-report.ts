import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type AlterationEntry = {
  target: CardInfo;
  kind: AlterationType;
  value: number;
  remainingTurns: number;
};

export type BuffReport = {
  kind: StepKind.Buff;
  name?: string;
  source: CardInfo;
  buffs: AlterationEntry[];
  energy: number;
  powerId?: string;
};

export type DebuffReport = {
  kind: StepKind.Debuff;
  name?: string;
  source: CardInfo;
  debuffs: AlterationEntry[];
  energy: number;
  powerId?: string;
};
