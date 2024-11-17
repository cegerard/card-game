import { CardInfo } from '../../cards/@types/card-info';

export type DamageReport = {
  attacker: CardInfo;
  defender: CardInfo;
  damage: number;
  isCritical: boolean;
};
