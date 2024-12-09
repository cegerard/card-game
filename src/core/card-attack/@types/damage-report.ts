import { CardInfo } from '../../cards/@types/card-info';

export type Damage = {
  defender: CardInfo;
  damage: number;
  isCritical: boolean;
};

export type DamageReport = {
  attacker: CardInfo;
  damages: Damage[];
};
