import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { session, resetSession } from '../session.js';

describe('arcade session store', () => {
  beforeEach(() => {
    resetSession();
  });

  it('has initial state with currentLevel 1', () => {
    expect(get(session).currentLevel).toBe(1);
  });

  it('has initial phase "idle"', () => {
    expect(get(session).phase).toBe('idle');
  });

  it('has initial fightResult null', () => {
    expect(get(session).fightResult).toBeNull();
  });

  it('resetSession restores initial state after mutation', () => {
    session.update((s) => ({ ...s, currentLevel: 3, phase: 'combat' }));
    resetSession();

    expect(get(session)).toEqual({ currentLevel: 1, phase: 'idle', fightResult: null });
  });
});
