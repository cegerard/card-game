import type { CardDefinition, CardStats } from '@card-game/shared-types';
import type { CardProgression } from '$lib/progression/types.js';
import { computeConvertibleExperience } from '$lib/progression/convertible-experience.js';
import { STAT_WEIGHTS, ARCHETYPE_MODIFIERS } from './constants.js';
import { XP_MULTIPLIERS, STAT_CAPS } from '$lib/experience/constants.js';

const MIN_DIFFICULTY = 0.5;
const MAX_DIFFICULTY = 2;

/**
 * Puissance de combat d'une carte : le score global, mais calculé sur ses
 * valeurs actuelles (base + XP convertible) plutôt que ses seules valeurs
 * de base (Notion > Calcul du score global > § Puissance de combat).
 *
 * Le modificateur de rôle n'est appliqué qu'une seule fois, à la
 * pondération finale — jamais sur la part XP elle-même, contrairement à
 * computeEffectiveStats (étape 4) qui l'applique au gain d'XP pour produire
 * les stats de combat. L'appliquer deux fois ici surévaluerait les cartes
 * très spécialisées (un modificateur appliqué au carré sur la part XP).
 *
 * XP convertible = XP cumulée plafonnée par le palier de fusion actuel de
 * la carte (Notion > Système d'expérience > § 4) : une carte plafonnée
 * cesse de gagner en puissance tant qu'elle n'a pas fusionné.
 */
export function computeCardPower(
  definition: CardDefinition,
  progression: CardProgression,
): number {
  const modifiers = ARCHETYPE_MODIFIERS[definition.archetype];
  const convertibleXp = computeConvertibleExperience(progression);
  return (Object.keys(STAT_WEIGHTS) as (keyof CardStats)[]).reduce(
    (total, stat) => {
      const gain = convertibleXp * XP_MULTIPLIERS[stat];
      const raw = definition.stats[stat] + gain;
      const cap = STAT_CAPS[stat];
      const value = cap !== undefined ? Math.min(raw, cap) : raw;
      const modifier = modifiers[stat] ?? 1;
      return total + value * STAT_WEIGHTS[stat] * modifier;
    },
    0,
  );
}

export interface CardWithProgression {
  definition: CardDefinition;
  progression: CardProgression;
}

/** Puissance d'une équipe : somme des puissances de ses cartes. */
export function computeTeamPower(cards: CardWithProgression[]): number {
  return cards.reduce(
    (total, { definition, progression }) =>
      total + computeCardPower(definition, progression),
    0,
  );
}

/**
 * Ratio de difficulté, borné entre 0,5 et 2, utilisé comme facteur du gain
 * d'XP de fin de combat (Notion > Système d'expérience > § 2). Une
 * puissance joueur nulle ou négative (cas dégénéré, ne devrait pas
 * survenir avec des stats réelles) retombe sur le plafond haut plutôt que
 * de diviser par zéro.
 */
export function computeDifficulty(
  opponentPower: number,
  playerPower: number,
): number {
  if (playerPower <= 0) return MAX_DIFFICULTY;
  const ratio = opponentPower / playerPower;
  return Math.min(Math.max(ratio, MIN_DIFFICULTY), MAX_DIFFICULTY);
}
