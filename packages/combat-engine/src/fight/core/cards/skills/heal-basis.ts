import { FightingCard } from '../fighting-card';
import { RateBasis } from '../@types/rate-basis';

/**
 * Heals one target and returns the health points actually restored, capped at
 * the target's maximum by `FightingCard.heal()`, and 0 when the target is cut
 * off its allies support.
 */
export function applyHealing(
  source: FightingCard,
  target: FightingCard,
  rate: number,
  basis: RateBasis = 'source-attack',
): number {
  if (target.refusesSupportFrom(source)) return 0;

  switch (basis) {
    case 'source-attack':
      return target.heal(source.actualAttack * rate);
    case 'target-max-health':
      return target.healShareOfMaxHealth(rate);
    default:
      throw new Error(`Unknown healing basis: ${basis}`);
  }
}
