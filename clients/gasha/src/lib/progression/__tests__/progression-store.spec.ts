import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { createProgressionStore } from '../progression-store.js';
import type { CardProgression, ProgressionRepository } from '../types.js';

function createInMemoryRepository(
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

describe('createProgressionStore', () => {
  it('returns a default progression for a card with no history', () => {
    const progressionStore = createProgressionStore(createInMemoryRepository());
    expect(progressionStore.getProgression('arionis')).toEqual({
      cardId: 'arionis',
      experience: 0,
      tier: 1,
    });
  });

  it('loads pre-existing progressions from the repository at creation', () => {
    const repository = createInMemoryRepository([
      { cardId: 'kaelion', experience: 500, tier: 2 },
    ]);
    const progressionStore = createProgressionStore(repository);
    expect(progressionStore.getProgression('kaelion').experience).toBe(500);
  });

  it('setProgression updates what getProgression returns', () => {
    const progressionStore = createProgressionStore(createInMemoryRepository());
    progressionStore.setProgression({
      cardId: 'arionis',
      experience: 120,
      tier: 1,
    });
    expect(progressionStore.getProgression('arionis').experience).toBe(120);
  });

  it('setProgression writes through to the underlying repository', () => {
    const repository = createInMemoryRepository();
    const progressionStore = createProgressionStore(repository);
    progressionStore.setProgression({
      cardId: 'arionis',
      experience: 120,
      tier: 1,
    });
    expect(repository.get('arionis')?.experience).toBe(120);
  });

  it('is reactive: subscribers see updates from setProgression', () => {
    const progressionStore = createProgressionStore(createInMemoryRepository());
    progressionStore.setProgression({
      cardId: 'arionis',
      experience: 120,
      tier: 1,
    });
    expect(get(progressionStore)['arionis'].experience).toBe(120);
  });

  it('reset clears both the store and the repository', () => {
    const repository = createInMemoryRepository();
    const progressionStore = createProgressionStore(repository);
    progressionStore.setProgression({
      cardId: 'arionis',
      experience: 120,
      tier: 1,
    });
    progressionStore.reset();
    expect(repository.getAll()).toHaveLength(0);
  });

  it('a fresh store built on the same repository sees prior writes (restart)', () => {
    const repository = createInMemoryRepository();
    createProgressionStore(repository).setProgression({
      cardId: 'arionis',
      experience: 250,
      tier: 1,
    });
    const reopened = createProgressionStore(repository);
    expect(reopened.getProgression('arionis').experience).toBe(250);
  });
});
