import type { CardStats } from '@card-game/shared-types';

/**
 * Multiplicateurs de conversion XP → caractéristique, calibrés sur
 * l'échelle réelle du roster (repère : +50 % à 10 000 XP cumulés sur les
 * stats qui ne sont pas des pourcentages). Source de vérité unique, doit
 * rester identique à Notion > Système d'expérience > § 3.
 */
export const XP_MULTIPLIERS: Record<keyof CardStats, number> = {
  attack: 0.004,
  defense: 0.0025,
  health: 0.025,
  speed: 0.004,
  accuracy: 0.001,
  agility: 0.001,
};

/**
 * Plafonds appliqués à la valeur effective, après conversion. Précisions et
 * Esquive sont des pourcentages dans le moteur de combat : au-delà de 100
 * une chance de toucher ou d'esquiver n'a plus de sens. La Vitesse pilote
 * le nombre d'attaques par tour et doit rester bornée pour la même raison.
 * Attaque, Défense et Santé n'ont volontairement pas de plafond.
 */
export const STAT_CAPS: Partial<Record<keyof CardStats, number>> = {
  speed: 150,
  accuracy: 99,
  agility: 95,
};
