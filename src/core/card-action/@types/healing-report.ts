import { CardInfo } from '../../cards/@types/card-info';

type Healing = {
  target: CardInfo;
  healed: number;
  remainingHealth: number;
};

export type HealingReport = {
  kind: 'healing';
  source: CardInfo;
  heal: Healing[];
  energy: number;
};
