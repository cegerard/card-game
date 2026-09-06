import type { CardDefinition, CardStats } from '@card-game/shared-types';
import { STAT_WEIGHTS, ARCHETYPE_MODIFIERS } from './constants.js';

/**
 * Score global d'une carte, calculé sur ses valeurs de BASE (jamais sur ses
 * valeurs effectives une fois l'expérience appliquée — voir Notion >
 * Système d'expérience > § 6 Règles d'équilibrage). Sert à comparer le
 * design des cartes entre elles, indépendamment de leur historique de jeu.
 */
export function computeGlobalScore(card: CardDefinition): number {
  const modifiers = ARCHETYPE_MODIFIERS[card.archetype];
  return (Object.keys(STAT_WEIGHTS) as (keyof CardStats)[]).reduce(
    (total, stat) => {
      const modifier = modifiers[stat] ?? 1;
      return total + card.stats[stat] * STAT_WEIGHTS[stat] * modifier;
    },
    0,
  );
}
