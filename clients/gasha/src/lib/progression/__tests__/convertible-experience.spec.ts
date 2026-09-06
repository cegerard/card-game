import { describe, it, expect } from 'vitest';
import { computeConvertibleExperience } from '../convertible-experience.js';
import type { CardProgression } from '../types.js';

describe('computeConvertibleExperience', () => {
  it('returns the full XP when below the tier cap', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 3000,
      tier: 1,
    };
    expect(computeConvertibleExperience(progression)).toBe(3000);
  });

  it('clamps to the tier cap when XP exceeds it', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    expect(computeConvertibleExperience(progression)).toBe(5000);
  });

  it('returns the full value exactly at the cap boundary', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 5000,
      tier: 1,
    };
    expect(computeConvertibleExperience(progression)).toBe(5000);
  });

  it('is never clamped at tier 5 (uncapped)', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    };
    expect(computeConvertibleExperience(progression)).toBe(10_000_000);
  });

  it('uses the cap of the current tier, not a higher one', () => {
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 20000,
      tier: 2,
    };
    // Plafond ★2 = 15 000, pas 30 000 (★3)
    expect(computeConvertibleExperience(progression)).toBe(15000);
  });
});
