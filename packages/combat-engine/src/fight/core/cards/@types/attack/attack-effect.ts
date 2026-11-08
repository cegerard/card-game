import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { Debuff } from '../alteration/alteration-detail';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { StateEffectType } from '../state/state-effect-type';
import { DamageType } from '../damage/damage-type';
import { MARK_EFFECT_TYPE } from '../mark/elemental-mark';
import {
  WEAK_POINT_EFFECT_TYPE,
  WEAK_POINT_ENDED_TYPE,
  WeakPoint,
  WeakPointEndReason,
} from '../weak-point/weak-point';

export type StateEffectResult = {
  type: StateEffectType;
  card: FightingCard;
  stacks?: number;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export type MarkEffectResult = {
  type: typeof MARK_EFFECT_TYPE;
  card: FightingCard;
  damageType: DamageType;
  stacks: number;
  triggeredDebuff?: { card: FightingCard; debuff: Debuff };
};

export type WeakPointEffectResult = {
  type: typeof WEAK_POINT_EFFECT_TYPE;
  card: FightingCard;
  weakPoint: WeakPoint;
};

export type WeakPointEndedResult = {
  type: typeof WEAK_POINT_ENDED_TYPE;
  card: FightingCard;
  name: string;
  reason: WeakPointEndReason;
};

export type EffectResult =
  | StateEffectResult
  | MarkEffectResult
  | WeakPointEffectResult
  | WeakPointEndedResult;

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
