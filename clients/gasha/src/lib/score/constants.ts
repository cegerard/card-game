import type { Archetype, CardStats } from '@card-game/shared-types';

/**
 * Poids par caractéristique. Source de vérité unique, doit rester identique
 * à Notion > Calcul du score global. Résistance et Régénération en sont
 * volontairement absentes : non implémentées dans le moteur de combat.
 */
export const STAT_WEIGHTS: Record<keyof CardStats, number> = {
  attack: 1,
  defense: 0.8,
  speed: 0.6,
  health: 0.05,
  accuracy: 0.5,
  agility: 0.5,
};

/**
 * Modificateurs de rôle par archétype. Toute caractéristique absente de la
 * map d'un archétype utilise un modificateur de 1,0 par défaut (voir
 * computeGlobalScore). Tank et Support portent des valeurs de transition :
 * leurs modificateurs d'origine valorisaient Résistance et Régénération,
 * reportés ici sur des caractéristiques réellement implémentées.
 */
export const ARCHETYPE_MODIFIERS: Record<
  Archetype,
  Partial<Record<keyof CardStats, number>>
> = {
  Tank: {
    health: 1.75,
    defense: 1.6,
    attack: 0.6,
    speed: 0.5,
  },
  DPS: {
    attack: 1.5,
    accuracy: 1.3,
    speed: 1.2,
    defense: 0.5,
    health: 0.7,
  },
  Assassin: {
    attack: 1.4,
    speed: 1.5,
    agility: 1.4,
    accuracy: 1.3,
    health: 0.5,
    defense: 0.4,
  },
  Support: {
    health: 1.5,
    defense: 1.3,
    agility: 1.5,
    accuracy: 1.3,
    attack: 0.3,
    speed: 0.7,
  },
  Guerrier: {
    attack: 1.2,
    health: 1.2,
    defense: 1.1,
    agility: 0.8,
  },
};
