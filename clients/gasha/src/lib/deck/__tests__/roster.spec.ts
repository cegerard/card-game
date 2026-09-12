import { describe, it, expect } from 'vitest';
import {
  CHARACTER_ROSTER,
  DEFAULT_DECK_IDS,
  findRosterCard,
} from '../roster.js';
import { toCombatConfig } from '@card-game/shared-types';

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

describe('Kaito', () => {
  const kaito = findRosterCard('kaito');

  it('is part of the roster', () => {
    expect(kaito).toBeDefined();
  });

  it('maps the Notion dodge stat to agility', () => {
    expect(kaito?.stats.agility).toBe(70);
  });

  it('carries his three extra skills, the slow riding on his marks', () => {
    expect(kaito?.skills.others.map((skill) => skill.kind)).toEqual([
      'ALTERATION',
      'CONDITIONAL_ATTACK',
      'TRANSFORMATION',
    ]);
  });

  it('keeps a fightable combat config', () => {
    expect(toCombatConfig(kaito!).agility).toBe(70);
  });
});
