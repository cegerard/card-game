import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';

type EffectType = 'poisoned' | 'burned' | 'frozen';
export type EffectResult = { type: EffectType; card: FightingCard };

export interface AttackEffect {
  rate: number;
  level: EffectLevel;
  type: string;

  applyEffect(
    defender: FightingCard,
    card: FightingCard,
    context: FightingContext,
  ): EffectResult;
}
