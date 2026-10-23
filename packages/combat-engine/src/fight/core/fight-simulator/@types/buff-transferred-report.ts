import { AlterationType } from '../../cards/@types/alteration/alteration-type';
import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type BuffTransferredReport = {
  kind: StepKind.BuffTransferred;
  name: string;
  source: CardInfo;
  target: CardInfo;
  alterations: {
    kind: AlterationType;
    value: number;
    remainingTurns: number;
  }[];
};
