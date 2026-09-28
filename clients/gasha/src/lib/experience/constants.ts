import type { CardStats } from '@card-game/shared-types';

/**
 * Multiplicateurs de conversion XP → caractéristique, calibrés sur
 * l'échelle réelle du roster (repère : +50 % à 10 000 XP cumulés sur les
 * stats qui ne sont pas des pourcentages). Source de vérité unique, doit
 * rester identique à Notion > Système d'expérience > § 3.
 *
 * La Régénération est en points de vie bruts, sur une échelle 20-75 : le
 * repère des +50 % la place à 0,002. La Résistance est un pourcentage
 * déguisé (la stat divisée par 200 donne la chance de refus), donc elle suit
 * la logique des Précisions et de l'Esquive : progression lente et plafond.
 */
export const XP_MULTIPLIERS: Record<keyof CardStats, number> = {
  attack: 0.004,
  defense: 0.0025,
  health: 0.025,
  speed: 0.004,
  accuracy: 0.001,
  agility: 0.001,
  regeneration: 0.002,
  resistance: 0.001,
};

/**
 * Plafonds appliqués à la valeur effective, après conversion. Précisions et
 * Esquive sont des pourcentages dans le moteur de combat : au-delà de 100
 * une chance de toucher ou d'esquiver n'a plus de sens. La Vitesse pilote
 * le nombre d'attaques par tour et doit rester bornée pour la même raison.
 * La Résistance est bornée à 100 parce qu'au-delà de 50 % de refus les
 * statuts deviennent une mécanique morte, et la Régénération à 100 parce
 * qu'elle rend un pourcentage écrasant de la santé maximale à chaque tour
 * sans rien coûter. Attaque, Défense et Santé n'ont volontairement pas de
 * plafond.
 */
export const STAT_CAPS: Partial<Record<keyof CardStats, number>> = {
  speed: 150,
  accuracy: 99,
  agility: 95,
  regeneration: 100,
  resistance: 100,
};
