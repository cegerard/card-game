import { CardInfo } from '../../cards/@types/card-info';
import { StateEffectType } from '../../cards/@types/state/state-effect-type';
import { StepKind } from './step';

export type DamageSharedReport = {
  kind: StepKind.DamageShared;
  name: string;
  card: CardInfo;
  shares: { card: CardInfo; damage: number; remainingHealth: number }[];
};

export type EnergyGainedReport = {
  kind: StepKind.EnergyGained;
  name: string;
  card: CardInfo;
  amount: number;
  energy: number;
};

export type EffectCleansedReport = {
  kind: StepKind.EffectCleansed;
  name: string;
  source: CardInfo;
  card: CardInfo;
  effectType: StateEffectType;
};
