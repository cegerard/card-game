import { describe, it, expect } from 'vitest';
import { fuseCard } from '../fuse-card.js';
import type { CardProgression } from '../types.js';

describe('fuseCard', () => {
  it('increments the tier by one', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    expect(fuseCard(progression).tier).toBe(2);
  });

  it('preserves the accumulated experience', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    expect(fuseCard(progression).experience).toBe(8000);
  });

  it('preserves the card id', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    expect(fuseCard(progression).cardId).toBe('arionis');
  });

  it('has no effect once the card is already at the maximum tier', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 5,
    };
    expect(fuseCard(progression)).toEqual(progression);
  });

  it('never exceeds tier 5 even after repeated fusions', () => {
    let progression: CardProgression = {
      cardId: 'arionis',
      experience: 0,
      tier: 1,
    };
    for (let i = 0; i < 10; i++) {
      progression = fuseCard(progression);
    }
    expect(progression.tier).toBe(5);
  });
});
