import { FightingCard } from '../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from './fighting-context';

export interface AttackEffect {
  rate: number;
  level: EffectLevel;

  applyEffect(
    defender: FightingCard,
    card: FightingCard,
    context: FightingContext,
  ): void;
}
