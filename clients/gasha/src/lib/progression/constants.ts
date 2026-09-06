import type { Tier } from './types.js';

/**
 * Plafond d'XP convertible par palier de fusion (Notion > Système
 * d'expérience > § 4). L'XP cumulée au-delà de ce plafond continue de
 * s'accumuler (CardProgression.experience) mais n'est convertie ni en
 * caractéristiques de combat, ni en puissance de combat, tant que la carte
 * n'a pas franchi le palier suivant.
 */
export const TIER_CAPS: Record<Tier, number> = {
  1: 5000,
  2: 15000,
  3: 30000,
  4: 50000,
  5: Infinity,
};
