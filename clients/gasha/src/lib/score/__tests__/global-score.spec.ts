import { describe, it, expect } from 'vitest';
import { computeGlobalScore } from '../global-score.js';
import type {
  Archetype,
  CardDefinition,
  CardStats,
} from '@card-game/shared-types';

function makeCard(
  archetype: Archetype,
  stats: CardStats,
  overrides: Partial<CardDefinition> = {},
): CardDefinition {
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
    ...overrides,
  };
}

describe('computeGlobalScore', () => {
  it('reproduces the published score for Arionis', () => {
    const arionis = makeCard('Guerrier', {
      attack: 85,
      defense: 60,
      health: 550,
      speed: 75,
      accuracy: 80,
      agility: 55,
    });
    expect(computeGlobalScore(arionis)).toBeCloseTo(294.8, 1);
  });

  it('reproduces the published score for Kaelion', () => {
    const kaelion = makeCard('Guerrier', {
      attack: 85,
      defense: 50,
      health: 530,
      speed: 80,
      accuracy: 85,
      agility: 60,
    });
    expect(computeGlobalScore(kaelion)).toBeCloseTo(292.3, 1);
  });

  it('applies the archetype modifier to a stat it lists', () => {
    const tank = makeCard('Tank', {
      attack: 0,
      defense: 0,
      health: 100,
      speed: 0,
      accuracy: 0,
      agility: 0,
    });
    // health weight 0.05 * Tank modifier 1.75 * 100 = 8.75
    expect(computeGlobalScore(tank)).toBeCloseTo(8.75, 2);
  });

  it('falls back to a 1.0 modifier for a stat the archetype does not list', () => {
    const tank = makeCard('Tank', {
      attack: 0,
      defense: 0,
      health: 0,
      speed: 0,
      accuracy: 100,
      agility: 0,
    });
    // accuracy weight 0.5 * default modifier 1.0 * 100 = 50, Tank lists no accuracy entry
    expect(computeGlobalScore(tank)).toBeCloseTo(50, 2);
  });

  it('gives different scores to different archetypes with identical stats', () => {
    const stats: CardStats = {
      attack: 80,
      defense: 50,
      health: 500,
      speed: 70,
      accuracy: 80,
      agility: 60,
    };
    const asAssassin = computeGlobalScore(makeCard('Assassin', stats));
    const asSupport = computeGlobalScore(makeCard('Support', stats));
    expect(asAssassin).not.toBeCloseTo(asSupport, 0);
  });

  it('ignores resistance when computing the score', () => {
    const stats: CardStats = {
      attack: 80,
      defense: 50,
      health: 500,
      speed: 70,
      accuracy: 80,
      agility: 60,
    };
    const withLowResistance = computeGlobalScore(
      makeCard('Guerrier', stats, { resistance: 10 }),
    );
    const withHighResistance = computeGlobalScore(
      makeCard('Guerrier', stats, { resistance: 90 }),
    );
    expect(withLowResistance).toBe(withHighResistance);
  });

  it('ignores regeneration when computing the score', () => {
    const stats: CardStats = {
      attack: 80,
      defense: 50,
      health: 500,
      speed: 70,
      accuracy: 80,
      agility: 60,
    };
    const withLowRegen = computeGlobalScore(
      makeCard('Support', stats, { regeneration: 10 }),
    );
    const withHighRegen = computeGlobalScore(
      makeCard('Support', stats, { regeneration: 90 }),
    );
    expect(withLowRegen).toBe(withHighRegen);
  });
});
