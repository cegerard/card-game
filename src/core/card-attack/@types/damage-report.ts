import { FightingCard } from '../../cards/fighting-card';

export type DamageReport = {
  attacker: FightingCard;
  defender: FightingCard;
  damage: number;
  isCritical: boolean;
};
