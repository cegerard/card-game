import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';

export type EffectResult = { type: 'poisoned'; card: FightingCard };

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
