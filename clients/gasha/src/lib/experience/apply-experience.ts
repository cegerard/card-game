import type { CardDefinition, CardStats } from '@card-game/shared-types';
import type { CardProgression } from '$lib/progression/types.js';
import { ARCHETYPE_MODIFIERS } from '$lib/score/constants.js';
import { XP_MULTIPLIERS, STAT_CAPS } from './constants.js';

/**
 * Caractéristiques effectives d'une carte compte tenu de son XP cumulée.
 * Réutilise exactement les modificateurs de rôle du score global (Notion >
 * Système d'expérience > § 3 : « en réutilisant exactement les
 * modificateurs de rôle déjà définis dans Calcul du score global »).
 *
 * L'XP utilisée ici est l'XP cumulée brute : le plafond d'XP convertible
 * par palier de fusion (Notion > Système d'expérience > § 4) est introduit
 * à l'étape 7 du plan, pas ici.
 */
export function computeEffectiveStats(
  definition: CardDefinition,
  progression: CardProgression,
): CardStats {
  const modifiers = ARCHETYPE_MODIFIERS[definition.archetype];
  const stats = { ...definition.stats };
  (Object.keys(stats) as (keyof CardStats)[]).forEach((stat) => {
    const modifier = modifiers[stat] ?? 1;
    const gain = progression.experience * XP_MULTIPLIERS[stat] * modifier;
    const raw = definition.stats[stat] + gain;
    const cap = STAT_CAPS[stat];
    // Le plancher à la valeur de base protège d'un modificateur négatif
    // hypothétique ; aucun archétype actuel n'en a.
    const floored = Math.max(raw, definition.stats[stat]);
    stats[stat] = cap !== undefined ? Math.min(floored, cap) : floored;
  });
  return stats;
}

/**
 * Projette une carte vers ses valeurs effectives, prête pour
 * toCombatConfig(). Point d'insertion décrit dans le plan d'implémentation,
 * étape 4 : se branche entre la définition de carte et l'appel au moteur.
 */
export function applyExperience(
  definition: CardDefinition,
  progression: CardProgression,
): CardDefinition {
  return {
    ...definition,
    stats: computeEffectiveStats(definition, progression),
  };
}
