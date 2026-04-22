import { CardInfo } from '../../cards/@types/card-info';
import { DamageType } from '../../cards/@types/damage/damage-type';
import { StepKind } from './step';

export type Damage = {
  defender: CardInfo;
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  remainingHealth: number;
  kind?: DamageType[];
};

export type DamageReport = {
  name?: string;
  attacker: CardInfo;
  damages: Damage[];
  energy: number;
};

export type AttackStepReport = { kind: StepKind.Attack } & DamageReport;
export type SpecialAttackStepReport = {
  kind: StepKind.SpecialAttack;
} & DamageReport;
