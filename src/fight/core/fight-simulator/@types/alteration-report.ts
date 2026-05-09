import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type BuffReport = {
  kind: StepKind.Buff;
  name?: string;
  source: CardInfo;
  buffs: {
    target: CardInfo;
    kind: AlterationType;
    value: number;
    remainingTurns: number;
  }[];
  energy: number;
  powerId?: string;
};

export type DebuffReport = {
  kind: StepKind.Debuff;
  name?: string;
  source: CardInfo;
  debuffs: {
    target: CardInfo;
    kind: AlterationType;
    value: number;
    remainingTurns: number;
  }[];
  energy: number;
  powerId?: string;
};
