import { describe, it, expect } from 'vitest';
import { applyExperience, computeEffectiveStats } from '../apply-experience.js';
import { fuseCard } from '$lib/progression/fuse-card.js';
import type {
  Archetype,
  CardDefinition,
  CardStats,
} from '@card-game/shared-types';
import type { CardProgression } from '$lib/progression/types.js';

function makeCard(archetype: Archetype, stats: CardStats): CardDefinition {
  return {
    id: 'test-card',
    name: 'Test Card',
    archetype,
    element: 'FIRE',
    stats,
    criticalChance: 0.05,
    skills: {
      special: {
        kind: 'ATTACK',
        name: 'Special',
        damages: [{ type: 'PHYSICAL', rate: 1 }],
        energy: 3,
        targetingStrategy: 'position-based',
      },
      others: [],
    },
    behaviors: { dodge: 'simple-dodge' },
  };
}

const arionis = makeCard('Guerrier', {
  attack: 85,
  defense: 60,
  health: 550,
  speed: 75,
  accuracy: 80,
  agility: 55,
});

const noProgress: CardProgression = {
  cardId: 'test-card',
  experience: 0,
  tier: 1,
};

const arionisAt10k: CardProgression = {
  cardId: 'arionis',
  experience: 10000,
  tier: 2,
};

describe('computeEffectiveStats', () => {
  it('reproduces the documented example: Arionis attack at 10k XP', () => {
    const stats = computeEffectiveStats(arionis, arionisAt10k);
    expect(stats.attack).toBeCloseTo(133, 5);
  });

  it('reproduces the documented example: Arionis health at 10k XP', () => {
    const stats = computeEffectiveStats(arionis, arionisAt10k);
    expect(stats.health).toBeCloseTo(850, 5);
  });

  it('reproduces the documented example: Arionis speed at 10k XP', () => {
    const stats = computeEffectiveStats(arionis, arionisAt10k);
    expect(stats.speed).toBeCloseTo(115, 5);
  });

  it('reproduces the documented example: Arionis agility at 10k XP', () => {
    const stats = computeEffectiveStats(arionis, arionisAt10k);
    expect(stats.agility).toBeCloseTo(63, 5);
  });

  it('returns the base stats unchanged when experience is zero', () => {
    const stats = computeEffectiveStats(arionis, noProgress);
    expect(stats).toEqual(arionis.stats);
  });

  it('caps speed at 150 for a card with very high experience', () => {
    const stats = computeEffectiveStats(arionis, {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    });
    expect(stats.speed).toBe(150);
  });

  it('caps accuracy at 99 for a card with very high experience', () => {
    const stats = computeEffectiveStats(arionis, {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    });
    expect(stats.accuracy).toBe(99);
  });

  it('caps agility at 95 for a card with very high experience', () => {
    const stats = computeEffectiveStats(arionis, {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    });
    expect(stats.agility).toBe(95);
  });

  it('does not cap attack, defense or health even at very high experience', () => {
    const stats = computeEffectiveStats(arionis, {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    });
    expect(stats.attack).toBeGreaterThan(1000);
  });

  it('caps the stat gain once XP exceeds the tier ceiling (★1 = 5 000)', () => {
    const overCeiling: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    const atCeiling: CardProgression = {
      cardId: 'arionis',
      experience: 5000,
      tier: 1,
    };
    expect(computeEffectiveStats(arionis, overCeiling)).toEqual(
      computeEffectiveStats(arionis, atCeiling),
    );
  });

  it('unlocks the XP held in reserve immediately after fusion', () => {
    const overCeiling: CardProgression = {
      cardId: 'arionis',
      experience: 8000,
      tier: 1,
    };
    const beforeFusion = computeEffectiveStats(arionis, overCeiling).attack;
    const afterFusion = computeEffectiveStats(
      arionis,
      fuseCard(overCeiling),
    ).attack;
    expect(afterFusion).toBeGreaterThan(beforeFusion);
  });
});

describe('applyExperience', () => {
  it('preserves every field other than stats', () => {
    const result = applyExperience(arionis, arionisAt10k);
    expect({ ...result, stats: undefined }).toEqual({
      ...arionis,
      stats: undefined,
    });
  });

  it('replaces stats with the effective values', () => {
    const result = applyExperience(arionis, arionisAt10k);
    expect(result.stats.attack).toBeCloseTo(133, 5);
  });
});
