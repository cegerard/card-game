import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { Debuff } from '../alteration/debuff';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { StateEffectType } from '../state/state-effect-type';

export type EffectResult = {
  type: StateEffectType;
  card: FightingCard;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export interface AttackEffect {
  rate: number;
  level: EffectLevel;
  type: string;
  triggeredDebuff?: EffectTriggeredDebuff;
  terminationEvent?: string;
  probability?: number;

  applyEffect(
    defender: FightingCard,
    card: FightingCard,
    context: FightingContext,
  ): EffectResult;
}
