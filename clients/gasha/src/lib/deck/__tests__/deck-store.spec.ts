import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { DEFAULT_DECK_IDS } from '../roster.js';
import {
  selectedCardIds,
  selectedDeckCards,
  isDeckComplete,
  toggleCard,
  resetDeck,
} from '../deck-store.js';

describe('deck store', () => {
  beforeEach(() => {
    resetDeck();
  });

  it('starts with the default deck ids', () => {
    expect(get(selectedCardIds)).toEqual(DEFAULT_DECK_IDS);
  });

  it('toggleCard removes a selected id', () => {
    toggleCard(DEFAULT_DECK_IDS[0]);
    expect(get(selectedCardIds)).not.toContain(DEFAULT_DECK_IDS[0]);
  });

  it('toggleCard adds an unselected id when below the limit', () => {
    toggleCard(DEFAULT_DECK_IDS[0]);
    toggleCard(DEFAULT_DECK_IDS[0]);
    expect(get(selectedCardIds)).toContain(DEFAULT_DECK_IDS[0]);
  });

  it('toggleCard ignores a new id when the deck is full', () => {
    toggleCard('player-storm-caller');
    expect(get(selectedCardIds)).not.toContain('player-storm-caller');
  });

  it('isDeckComplete is true with 5 cards', () => {
    expect(get(isDeckComplete)).toBe(true);
  });

  it('isDeckComplete is false with 4 cards', () => {
    toggleCard(DEFAULT_DECK_IDS[0]);
    expect(get(isDeckComplete)).toBe(false);
  });

  it('selectedDeckCards resolves ids to card configs in order', () => {
    expect(get(selectedDeckCards).map((card) => card.id)).toEqual(
      DEFAULT_DECK_IDS,
    );
  });
});
