import { FightingCard } from '../../fighting-card';

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
