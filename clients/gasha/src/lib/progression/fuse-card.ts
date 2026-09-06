import type { CardProgression, Tier } from './types.js';

const MAX_TIER: Tier = 5;

/**
 * Fait franchir un palier de fusion à une carte (★n → ★n+1, jusqu'à ★5).
 * Sans effet sur l'XP cumulée : l'XP en réserve au-delà de l'ancien
 * plafond devient immédiatement convertible, sans aucune action
 * supplémentaire, puisque computeConvertibleExperience recalcule toujours
 * à partir de l'XP cumulée brute et du palier courant.
 *
 * Sans effet si la carte est déjà au palier maximum.
 *
 * Ne gère pas la détection de doublons ni leur consommation : le jeu n'a
 * pas encore de système de tirage produisant des doublons (voir plan
 * d'implémentation, points ouverts). Cette fonction est la transition
 * d'état pure, appelable dès qu'un doublon est identifié par ailleurs.
 */
export function fuseCard(progression: CardProgression): CardProgression {
  if (progression.tier >= MAX_TIER) return progression;
  return { ...progression, tier: (progression.tier + 1) as Tier };
}
