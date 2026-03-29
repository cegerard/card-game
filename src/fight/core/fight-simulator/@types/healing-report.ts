import { CardInfo } from '../../cards/@types/card-info';
import { StepKind } from './step';

type Healing = {
  target: CardInfo;
  healed: number;
  remainingHealth: number;
};

export type HealingReport = {
  kind: StepKind.Healing;
  source: CardInfo;
  heal: Healing[];
  energy: number;
  powerId?: string;
};
