import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { Debuff } from '../buff/debuff';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';

type EffectType = 'poisoned' | 'burned' | 'frozen';
export type EffectResult = {
  type: EffectType;
  card: FightingCard;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export interface AttackEffect {
  rate: number;
  level: EffectLevel;
  type: string;
  triggeredDebuff?: EffectTriggeredDebuff;
  terminationEvent?: string;

  applyEffect(
    defender: FightingCard,
    card: FightingCard,
    context: FightingContext,
  ): EffectResult;
}
