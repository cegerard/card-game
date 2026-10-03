import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';
import { BuffResult } from './alteration-result';
import { DamageType } from '../damage/damage-type';

export type AttackResult = {
  damage: number;
  shieldAbsorbed?: number;
  shieldBroken?: boolean;
  isCritical: boolean;
  dodge: boolean;
  defender: FightingCard;
  /** The ally this hit was aimed at, when a guardian stepped in front. */
  interceptedFor?: FightingCard;
  remainingHealth: number;
  effects?: EffectResult[];
  buffResults?: BuffResult[];
  kind?: DamageType[];
  survived?: boolean;
  survivedSkillName?: string;
  mitigated?: boolean;
  mitigatedSkillName?: string;
  /** Bleed stacks a detonation consumed on the defender. */
  consumedBleedStacks?: number;
};
