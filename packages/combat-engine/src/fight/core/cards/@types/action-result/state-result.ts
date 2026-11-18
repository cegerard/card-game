import type { StateEffectType } from '@card-game/shared-types';
import { FightingCard } from '../../fighting-card';

export type StateResult = {
  type: StateEffectType;
  card: FightingCard;
  damage: number;
  remainingHealth: number;
  remainingTurns: number;
  remainingStacks?: number;
};
