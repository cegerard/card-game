import type { Archetype, CardStats } from '@card-game/shared-types';

/**
 * Poids par caractéristique. Source de vérité unique, doit rester identique
 * à Notion > Calcul du score global.
 */
export const STAT_WEIGHTS: Record<keyof CardStats, number> = {
  attack: 1,
  defense: 0.8,
  speed: 0.6,
  health: 0.05,
  accuracy: 0.5,
  agility: 0.5,
  regeneration: 0.4,
  resistance: 0.4,
};

/**
 * Modificateurs de rôle par archétype. Toute caractéristique absente de la
 * map d'un archétype utilise un modificateur de 1,0 par défaut (voir
 * computeGlobalScore).
 *
 * Tank et Support portaient des valeurs de transition : leur Résistance et
 * leur Régénération n'étant pas calculées, leur valeur avait été reportée
 * sur la Santé, la Défense, l'Esquive et les Précisions. Les deux stats
 * étant maintenant pondérées, ce report est retiré — le conserver les aurait
 * comptées deux fois.
 *
 * Les archétypes offensifs déprécient la Résistance et la Régénération comme
 * ils déprécient déjà la Santé et la Défense : ce sont des stats d'endurance,
 * et un Assassin ne vit pas assez longtemps pour les rentabiliser. La même
 * map pilote aussi la conversion d'XP (computeEffectiveStats), donc ces
 * valeurs décident autant du design que de la progression.
 */
export const ARCHETYPE_MODIFIERS: Record<
  Archetype,
  Partial<Record<keyof CardStats, number>>
> = {
  Tank: {
    health: 1.3,
    defense: 1.2,
    resistance: 1.3,
    regeneration: 1.2,
    attack: 0.6,
    speed: 0.5,
  },
  DPS: {
    attack: 1.5,
    accuracy: 1.3,
    speed: 1.2,
    defense: 0.5,
    health: 0.7,
    regeneration: 0.6,
    resistance: 0.6,
  },
  Assassin: {
    attack: 1.4,
    speed: 1.5,
    agility: 1.4,
    accuracy: 1.3,
    health: 0.5,
    defense: 0.4,
    regeneration: 0.5,
    resistance: 0.5,
  },
  Support: {
    regeneration: 1.8,
    resistance: 1.4,
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
