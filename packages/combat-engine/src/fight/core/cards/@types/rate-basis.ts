/**
 * What a rate is a share of, for a heal or a bleed.
 *
 * `source-attack` is the historical basis and stays the default: the amount
 * scales with the caster. `target-max-health` reads the receiving card
 * instead, which is how a kit phrased as "the ally recovers 10% of its health
 * per turn" or "bleeds 2% of its max health per turn" means it — a share of
 * the receiver, the same size whoever casts it.
 */
export type RateBasis = 'source-attack' | 'target-max-health';

export const RATE_BASES: readonly RateBasis[] = [
  'source-attack',
  'target-max-health',
];
