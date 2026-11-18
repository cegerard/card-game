import { describe, it, expect } from 'vitest';
import { detectOutcome } from '../outcome.js';
import { attack, fightEnd, goblin, warrior } from './report-steps.js';

describe('detectOutcome', () => {
  it('returns "victory" when winner matches playerName', () => {
    expect(detectOutcome({ 0: fightEnd('Player') }, 'Player')).toBe('victory');
  });

  it('returns "game-over" when there is no winner (draw)', () => {
    expect(detectOutcome({ 0: fightEnd(null) }, 'Player')).toBe('game-over');
  });

  it('returns "game-over" when winner does not match playerName', () => {
    expect(detectOutcome({ 0: fightEnd('Level 1 — Rookies') }, 'Player')).toBe('game-over');
  });

  it('returns "game-over" when no fight_end step is present', () => {
    expect(detectOutcome({ 0: attack(warrior, goblin, 10) }, 'Player')).toBe('game-over');
  });
});
