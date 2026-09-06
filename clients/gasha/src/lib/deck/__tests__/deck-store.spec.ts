import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { DEFAULT_DECK_IDS } from '../roster.js';
import {
  selectedCardIds,
  selectedDeckCards,
  isDeckComplete,
  toggleCard,
  resetDeck,
} from '../deck-store.js';
import { progressionStore } from '$lib/progression/progression-store.js';

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

  describe('with experience applied', () => {
    afterEach(() => {
      progressionStore.reset();
    });

    it('boosts the combat stats of a card with cumulated XP', () => {
      const baseAttack = get(selectedDeckCards)[0].attack;
      progressionStore.setProgression({
        cardId: DEFAULT_DECK_IDS[0],
        experience: 10000,
        tier: 2,
      });
      const boostedAttack = get(selectedDeckCards)[0].attack;
      expect(boostedAttack).toBeGreaterThan(baseAttack);
    });

    it('does not affect the stats of a card with no progression of its own', () => {
      const otherCardBaseAttack = get(selectedDeckCards)[1].attack;
      progressionStore.setProgression({
        cardId: DEFAULT_DECK_IDS[0],
        experience: 10000,
        tier: 2,
      });
      expect(get(selectedDeckCards)[1].attack).toBe(otherCardBaseAttack);
    });
  });
});
