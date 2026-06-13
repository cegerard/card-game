import { describe, it, expect } from 'vitest';
import { detectOutcome } from '../outcome.js';
import type { FightResult } from '$lib/arcade/types.js';

describe('detectOutcome', () => {
  it('returns "victory" when winner matches playerName', () => {
    const result: FightResult = { 0: { kind: 'fight_end', winner: 'Player' } };
    expect(detectOutcome(result, 'Player')).toBe('victory');
  });

  it('returns "game-over" when winner is undefined (draw)', () => {
    const result: FightResult = { 0: { kind: 'fight_end', winner: undefined } };
    expect(detectOutcome(result, 'Player')).toBe('game-over');
  });

  it('returns "game-over" when winner does not match playerName', () => {
    const result: FightResult = { 0: { kind: 'fight_end', winner: 'Level 1 — Rookies' } };
    expect(detectOutcome(result, 'Player')).toBe('game-over');
  });

  it('returns "game-over" when no fight_end step is present', () => {
    const result: FightResult = { 0: { kind: 'attack' } };
    expect(detectOutcome(result, 'Player')).toBe('game-over');
  });
});
