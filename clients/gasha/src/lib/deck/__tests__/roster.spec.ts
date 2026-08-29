import { describe, it, expect } from 'vitest';
import {
  CHARACTER_ROSTER,
  DEFAULT_DECK_IDS,
  findRosterCard,
} from '../roster.js';

describe('character roster', () => {
  it('holds more characters than a deck can fit', () => {
    expect(CHARACTER_ROSTER.length).toBeGreaterThan(5);
  });

  it('has unique card ids', () => {
    const ids = CHARACTER_ROSTER.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('provides a default deck of 5 ids', () => {
    expect(DEFAULT_DECK_IDS).toHaveLength(5);
  });

  it('default deck ids all exist in the roster', () => {
    expect(DEFAULT_DECK_IDS.every((id) => findRosterCard(id))).toBe(true);
  });

  it('findRosterCard returns undefined for an unknown id', () => {
    expect(findRosterCard('nope')).toBeUndefined();
  });
});
