import { FightingCard } from '../../fighting-card';
import { EffectLevel } from './effect-level';
import { FightingContext } from '../fighting-context';
import { Debuff } from '../alteration/alteration-detail';
import { EffectTriggeredDebuff } from './effect-triggered-debuff';
import { StateEffectType } from '../state/state-effect-type';
import { DamageType } from '../damage/damage-type';
import { Randomizer } from '../../../randomizer';
import { MARK_EFFECT_TYPE } from '../mark/elemental-mark';
import {
  VULNERABILITY_EFFECT_TYPE,
  VULNERABILITY_ENDED_TYPE,
} from '../vulnerability/vulnerability';
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

export const ENERGY_DRAINED_TYPE = 'energy_drained';

export type EnergyDrainedResult = {
  type: typeof ENERGY_DRAINED_TYPE;
  card: FightingCard;
  amount: number;
  /** The gauge left. */
  energy: number;
};

export type VulnerabilityEffectResult = {
  type: typeof VULNERABILITY_EFFECT_TYPE;
  card: FightingCard;
  damageType: DamageType;
  rate: number;
  remainingTurns: number;
};

export type VulnerabilityEndedResult = {
  type: typeof VULNERABILITY_ENDED_TYPE;
  card: FightingCard;
  damageType: DamageType;
};

export const SUPPORT_BLOCKED_TYPE = 'support_blocked';
export const SUPPORT_BLOCK_ENDED_TYPE = 'support_block_ended';

export type SupportBlockedResult = {
  type: typeof SUPPORT_BLOCKED_TYPE;
  card: FightingCard;
  remainingTurns: number;
};

export type SupportBlockEndedResult = {
  type: typeof SUPPORT_BLOCK_ENDED_TYPE;
  card: FightingCard;
};

export const DECOY_STRUCK_TYPE = 'decoy_struck';

/** A decoy took the attack aimed at the card, and is gone. */
export type DecoyStruckResult = {
  type: typeof DECOY_STRUCK_TYPE;
  card: FightingCard;
  name: string;
  remainingDecoys: number;
};

export type EffectResult =
  | StateEffectResult
  | MarkEffectResult
  | WeakPointEffectResult
  | WeakPointEndedResult
  | EnergyDrainedResult
  | VulnerabilityEffectResult
  | VulnerabilityEndedResult
  | SupportBlockedResult
  | SupportBlockEndedResult
  | DecoyStruckResult;

/** Whether an effect with that optional chance fails its roll (none: never). */
export function failsChance(
  randomizer: Randomizer,
  probability?: number,
): boolean {
  return probability !== undefined && randomizer.random() >= probability;
}

/** The effects a hit reports, none being reported as absent. */
export function nonEmpty(effects: EffectResult[]): EffectResult[] | undefined {
  return effects.length > 0 ? effects : undefined;
}

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
