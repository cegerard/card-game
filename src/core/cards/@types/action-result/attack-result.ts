import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';

export type AttackResult = {
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  defender: FightingCard;
  effect?: EffectResult;
};
