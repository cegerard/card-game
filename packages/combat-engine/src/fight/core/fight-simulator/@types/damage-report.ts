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
  /**
   * How much of `damage` the shield buffer ate instead of the health pool.
   * Absent when no shield was in the way. Consumers track the buffer from
   * `shield_applied` and need this to draw it down (issue #326).
   */
  shieldAbsorbed?: number;
};

export type DamageReport = {
  name?: string;
  attacker: CardInfo;
  damages: Damage[];
  energy: number;
  powerId?: string;
};

export type AttackStepReport = { kind: StepKind.Attack } & DamageReport;
export type SpecialAttackStepReport = {
  kind: StepKind.SpecialAttack;
} & DamageReport;
