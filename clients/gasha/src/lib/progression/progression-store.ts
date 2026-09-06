import { writable } from 'svelte/store';
import type { CardProgression, ProgressionRepository } from './types.js';
import { defaultProgression } from './types.js';
import { createLocalStorageProgressionRepository } from './local-storage-repository.js';

export interface ProgressionStore {
  subscribe: import('svelte/store').Readable<
    Record<string, CardProgression>
  >['subscribe'];
  /** Retourne la progression d'une carte, ou sa progression par défaut. */
  getProgression(cardId: string): CardProgression;
  /** Écrit la progression, à la fois dans le dépôt et dans le store réactif. */
  setProgression(progression: CardProgression): void;
  reset(): void;
}

function loadInitialState(
  repository: ProgressionRepository,
): Record<string, CardProgression> {
  return Object.fromEntries(
    repository.getAll().map((progression) => [progression.cardId, progression]),
  );
}

/**
 * Fabrique du store de progression. Accepte un ProgressionRepository en
 * paramètre pour rester testable sans dépendre de localStorage ; l'usage
 * réel de l'application passe par le singleton `progressionStore` plus bas.
 */
export function createProgressionStore(
  repository: ProgressionRepository = createLocalStorageProgressionRepository(),
): ProgressionStore {
  const { subscribe, update } = writable<Record<string, CardProgression>>(
    loadInitialState(repository),
  );

  let snapshot: Record<string, CardProgression> = {};
  subscribe((state) => {
    snapshot = state;
  });

  function getProgression(cardId: string): CardProgression {
    return snapshot[cardId] ?? defaultProgression(cardId);
  }

  function setProgression(progression: CardProgression): void {
    repository.set(progression);
    update((state) => ({ ...state, [progression.cardId]: progression }));
  }

  function reset(): void {
    repository.reset();
    update(() => ({}));
  }

  return { subscribe, getProgression, setProgression, reset };
}

/**
 * Instance partagée par l'application, appuyée sur localStorage. Chargée une
 * fois au démarrage : c'est ce qui restitue l'XP des cartes après fermeture
 * et réouverture du jeu.
 */
export const progressionStore = createProgressionStore();
