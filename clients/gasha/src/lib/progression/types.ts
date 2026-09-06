/**
 * Palier d'évolution obtenu par fusion de doublons (★1 à ★5).
 * Voir Notion > Système d'expérience > § 4 Paliers de fusion et plafond d'XP.
 */
export type Tier = 1 | 2 | 3 | 4 | 5;

export interface CardProgression {
  cardId: string;
  /** XP cumulée à vie. Peut dépasser le plafond convertible du palier actuel. */
  experience: number;
  tier: Tier;
}

/**
 * Contrat de stockage de la progression du joueur, ignorant du support de
 * persistance. Une nouvelle implémentation (API serveur, IndexedDB...) ne
 * touche que le fichier qui l'implémente, jamais ses appelants.
 */
export interface ProgressionRepository {
  get(cardId: string): CardProgression | undefined;
  getAll(): CardProgression[];
  set(progression: CardProgression): void;
  reset(): void;
}

/** Progression de départ d'une carte jamais jouée : aucune XP, palier ★1. */
export function defaultProgression(cardId: string): CardProgression {
  return { cardId, experience: 0, tier: 1 };
}
