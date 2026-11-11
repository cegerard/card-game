import { CardInfo } from '../../cards/@types/card-info';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { StepKind } from './step';

/** An entangled card lost its offensive action. */
export type ActionFailedReport = {
  kind: StepKind.ActionFailed;
  card: CardInfo;
  cause: 'entangle';
};

export type EnergyDrainedReport = {
  kind: StepKind.EnergyDrained;
  card: CardInfo;
  amount: number;
  energy: number;
};

export type VulnerabilityAppliedReport = {
  kind: StepKind.VulnerabilityApplied;
  card: CardInfo;
  damageType: DamageType;
  rate: number;
  remainingTurns: number;
};

export type VulnerabilityEndedReport = {
  kind: StepKind.VulnerabilityEnded;
  card: CardInfo;
  damageType: DamageType;
};

/** The card no longer receives the heals and buffs of its allies. */
export type SupportBlockedReport = {
  kind: StepKind.SupportBlocked;
  card: CardInfo;
  remainingTurns: number;
};

export type SupportBlockEndedReport = {
  kind: StepKind.SupportBlockEnded;
  card: CardInfo;
};

/** A decoy took an attack aimed at the card. */
export type DecoyStruckReport = {
  kind: StepKind.DecoyStruck;
  name: string;
  card: CardInfo;
  remainingDecoys: number;
};
