import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';
import { BuffResults } from './buff-results';
import { DamageType } from '../damage/damage-type';

export type AttackResult = {
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  defender: FightingCard;
  remainingHealth?: number;
  effects?: EffectResult[];
  buffResults?: BuffResults;
  kind?: DamageType[];
};
