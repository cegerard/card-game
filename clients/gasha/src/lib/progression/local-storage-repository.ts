import type { CardProgression, ProgressionRepository } from './types.js';

const STORAGE_KEY = 'card-game:progression:v1';

function readAll(): Record<string, CardProgression> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CardProgression>) : {};
  } catch {
    // Stockage indisponible ou corrompu (quota, navigation privée, JSON
    // invalide) : on repart d'un état vide plutôt que de faire planter le jeu.
    return {};
  }
}

function writeAll(all: Record<string, CardProgression>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Écriture impossible (quota dépassé...) : la progression de ce combat
    // sera perdue mais le jeu continue plutôt que de planter.
  }
}

/**
 * Implémentation localStorage du contrat ProgressionRepository. Première
 * implémentation concrète du chantier ; un futur backend en fournira une
 * autre sans changer les appelants.
 */
export function createLocalStorageProgressionRepository(): ProgressionRepository {
  return {
    get(cardId) {
      return readAll()[cardId];
    },
    getAll() {
      return Object.values(readAll());
    },
    set(progression) {
      const all = readAll();
      all[progression.cardId] = progression;
      writeAll(all);
    },
    reset() {
      writeAll({});
    },
  };
}
