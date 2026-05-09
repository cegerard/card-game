import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';
import { BuffResult } from './alteration-result';
import { DamageType } from '../damage/damage-type';

export type AttackResult = {
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  defender: FightingCard;
  remainingHealth: number;
  effects?: EffectResult[];
  buffResults?: BuffResult[];
  kind?: DamageType[];
};
