import { derived, writable } from 'svelte/store';
import type { CardConfig } from '$lib/arcade/types.js';
import { DEFAULT_DECK_IDS, findRosterCard } from './roster.js';

export const DECK_SIZE = 5;

export const selectedCardIds = writable<string[]>([...DEFAULT_DECK_IDS]);

export function toggleCard(id: string): void {
  selectedCardIds.update((ids) => {
    if (ids.includes(id)) {
      return ids.filter((selected) => selected !== id);
    }
    if (ids.length >= DECK_SIZE) {
      return ids;
    }
    return [...ids, id];
  });
}

export function resetDeck(): void {
  selectedCardIds.set([...DEFAULT_DECK_IDS]);
}

export const selectedDeckCards = derived(selectedCardIds, (ids) =>
  ids
    .map(findRosterCard)
    .filter((card): card is CardConfig => card !== undefined),
);

export const isDeckComplete = derived(
  selectedCardIds,
  (ids) => ids.length === DECK_SIZE,
);
