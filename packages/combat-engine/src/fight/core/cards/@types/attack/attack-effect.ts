import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { Debuff } from '../alteration/alteration-detail';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { StateEffectType } from '../state/state-effect-type';
import { DamageType } from '../damage/damage-type';
import { MARK_EFFECT_TYPE } from '../mark/elemental-mark';

export type StateEffectResult = {
  type: StateEffectType;
  card: FightingCard;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export type MarkEffectResult = {
  type: typeof MARK_EFFECT_TYPE;
  card: FightingCard;
  damageType: DamageType;
  stacks: number;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export type EffectResult = StateEffectResult | MarkEffectResult;

export interface AttackEffect {
  rate: number;
  level?: EffectLevel;
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
