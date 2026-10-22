import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type ExecutedReport = {
  kind: StepKind.Executed;
  name: string;
  attacker: CardInfo;
  card: CardInfo;
};
