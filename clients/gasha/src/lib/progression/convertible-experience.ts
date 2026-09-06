import type { CardProgression } from './types.js';
import { TIER_CAPS } from './constants.js';

/**
 * XP réellement convertible en caractéristiques de combat ou en puissance
 * de combat : l'XP cumulée, plafonnée par le palier de fusion actuel de la
 * carte. L'excédent reste en réserve (voir CardProgression.experience) et
 * devient convertible dès la prochaine fusion (fuseCard).
 */
export function computeConvertibleExperience(
  progression: CardProgression,
): number {
  return Math.min(progression.experience, TIER_CAPS[progression.tier]);
}
