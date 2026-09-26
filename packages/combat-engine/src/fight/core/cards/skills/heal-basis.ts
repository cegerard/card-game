import { FightingCard } from '../fighting-card';

/**
 * What a healing rate is a share of.
 *
 * `source-attack` is the historical basis and stays the default: the heal
 * scales with the healer, which suits a support whose offence and care grow
 * together. `target-max-health` reads the card being healed instead, which is
 * how a kit phrased as "the ally recovers 10% of its health per turn" means it
 * — a share of the receiver, the same size whoever casts it.
 */
export type HealBasis = 'source-attack' | 'target-max-health';

/**
 * Heals one target and returns the health points actually restored, capped at
 * the target's maximum by `FightingCard.heal()`.
 */
export function applyHealing(
  source: FightingCard,
  target: FightingCard,
  rate: number,
  basis: HealBasis = 'source-attack',
): number {
  switch (basis) {
    case 'source-attack':
      return target.heal(source.actualAttack * rate);
    case 'target-max-health':
      return target.healShareOfMaxHealth(rate);
    default:
      throw new Error(`Unknown healing basis: ${basis}`);
  }
}
