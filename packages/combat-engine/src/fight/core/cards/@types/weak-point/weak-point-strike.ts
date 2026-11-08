import { FightingCard } from '../../fighting-card';
import { EffectResult } from '../attack/attack-effect';

/** The share of defense an attack ignores, more of it on an exposed defender. */
export function penetrationAgainst(
  defender: FightingCard,
  defensePenetration?: number,
  weakPointPenetration?: number,
): number | undefined {
  return weakPointPenetration !== undefined && defender.hasWeakPoint()
    ? Math.max(weakPointPenetration, defensePenetration ?? 0)
    : defensePenetration;
}

/** The effects a hit reports, none being reported as absent. */
export function nonEmpty(effects: EffectResult[]): EffectResult[] | undefined {
  return effects.length > 0 ? effects : undefined;
}
