import type { CardProgression, ProgressionRepository } from '../types.js';

/** Dépôt de progression en mémoire, pour tester sans localStorage. */
export function createInMemoryRepository(
  seed: CardProgression[] = [],
): ProgressionRepository {
  const store = new Map(seed.map((p) => [p.cardId, p]));
  return {
    get: (cardId) => store.get(cardId),
    getAll: () => [...store.values()],
    set: (progression) => {
      store.set(progression.cardId, progression);
    },
    reset: () => {
      store.clear();
    },
  };
}
