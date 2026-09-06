import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalStorageProgressionRepository } from '../local-storage-repository.js';

describe('createLocalStorageProgressionRepository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns undefined for a card never saved', () => {
    const repository = createLocalStorageProgressionRepository();
    expect(repository.get('arionis')).toBeUndefined();
  });

  it('returns a progression previously set', () => {
    const repository = createLocalStorageProgressionRepository();
    repository.set({ cardId: 'arionis', experience: 120, tier: 1 });
    expect(repository.get('arionis')).toEqual({
      cardId: 'arionis',
      experience: 120,
      tier: 1,
    });
  });

  it('persists across a fresh repository instance (simulated restart)', () => {
    createLocalStorageProgressionRepository().set({
      cardId: 'kaelion',
      experience: 500,
      tier: 2,
    });
    const reopened = createLocalStorageProgressionRepository();
    expect(reopened.get('kaelion')?.experience).toBe(500);
  });

  it('keeps progressions for different cards independent', () => {
    const repository = createLocalStorageProgressionRepository();
    repository.set({ cardId: 'arionis', experience: 100, tier: 1 });
    repository.set({ cardId: 'kaelion', experience: 200, tier: 1 });
    expect(repository.get('arionis')?.experience).toBe(100);
  });

  it('overwrites a progression when set again for the same card', () => {
    const repository = createLocalStorageProgressionRepository();
    repository.set({ cardId: 'arionis', experience: 100, tier: 1 });
    repository.set({ cardId: 'arionis', experience: 300, tier: 2 });
    expect(repository.get('arionis')).toEqual({
      cardId: 'arionis',
      experience: 300,
      tier: 2,
    });
  });

  it('getAll returns every stored progression', () => {
    const repository = createLocalStorageProgressionRepository();
    repository.set({ cardId: 'arionis', experience: 100, tier: 1 });
    repository.set({ cardId: 'kaelion', experience: 200, tier: 1 });
    expect(repository.getAll()).toHaveLength(2);
  });

  it('reset clears every stored progression', () => {
    const repository = createLocalStorageProgressionRepository();
    repository.set({ cardId: 'arionis', experience: 100, tier: 1 });
    repository.reset();
    expect(repository.getAll()).toHaveLength(0);
  });

  it('falls back to an empty read when storage holds invalid JSON', () => {
    window.localStorage.setItem('card-game:progression:v1', 'not-json');
    const repository = createLocalStorageProgressionRepository();
    expect(repository.getAll()).toEqual([]);
  });
});
