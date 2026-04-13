import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

export type StateEffectReport = {
  kind: StepKind.StateEffect;
  type: string;
  card: CardInfo;
  damage: number;
  remainingTurns: number;
  remainingHealth: number;
};
