import { FightingCard } from '../../fighting-card';
import { StateEffectType } from '../state/state-effect-type';

export type StateResult = {
  type: StateEffectType;
  card: FightingCard;
  damage: number;
  remainingHealth: number;
  remainingTurns: number;
  remainingStacks?: number;
};
