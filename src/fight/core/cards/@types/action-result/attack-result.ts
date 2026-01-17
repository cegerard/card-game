import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';
import { BuffResults } from './buff-results';

export type AttackResult = {
  damage: number;
  isCritical: boolean;
  dodge: boolean;
  defender: FightingCard;
  effect?: EffectResult;
  buffResults?: BuffResults;
};
