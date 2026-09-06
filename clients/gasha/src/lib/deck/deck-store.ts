import { derived, writable } from 'svelte/store';
import type { CardDefinition } from '@card-game/shared-types';
import { toCombatConfig } from '@card-game/shared-types';
import { DEFAULT_DECK_IDS, findRosterCard } from './roster.js';
import { progressionStore } from '$lib/progression/progression-store.js';
import { defaultProgression } from '$lib/progression/types.js';
import { applyExperience } from '$lib/experience/apply-experience.js';

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

// Point de projection définition -> configuration de combat. La progression
// est appliquée ici (Notion > Système d'expérience > Plan d'implémentation >
// Étape 4) avant toCombatConfig, qui reste une simple recopie : c'est ce qui
// fait qu'une carte avec de l'XP entre en combat avec des stats supérieures.
export const selectedDeckCards = derived(
  [selectedCardIds, progressionStore],
  ([ids, progressions]) =>
    ids
      .map(findRosterCard)
      .filter((card): card is CardDefinition => card !== undefined)
      .map((card) =>
        applyExperience(
          card,
          progressions[card.id] ?? defaultProgression(card.id),
        ),
      )
      .map(toCombatConfig),
);

export const isDeckComplete = derived(
  selectedCardIds,
  (ids) => ids.length === DECK_SIZE,
);
