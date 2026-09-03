import { derived, writable } from 'svelte/store';
import type { CardDefinition } from '@card-game/shared-types';
import { toCombatConfig } from '@card-game/shared-types';
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

// Point de projection définition -> configuration de combat : c'est ici
// que se branchera la conversion d'expérience (voir Notion > Système
// d'expérience > Plan d'implémentation > Étape 4), au moment où
// toCombatConfig prendra l'XP et le palier de chaque carte en paramètres.
export const selectedDeckCards = derived(selectedCardIds, (ids) =>
  ids
    .map(findRosterCard)
    .filter((card): card is CardDefinition => card !== undefined)
    .map(toCombatConfig),
);

export const isDeckComplete = derived(
  selectedCardIds,
  (ids) => ids.length === DECK_SIZE,
);
