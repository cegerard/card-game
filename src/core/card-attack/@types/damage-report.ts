import { CardInfo } from '../../cards/@types/card-info';

export type Damage = {
  defender: CardInfo;
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  remainingHealth: number;
};

export type DamageReport = {
  attacker: CardInfo;
  damages: Damage[];
  energy: number;
};
