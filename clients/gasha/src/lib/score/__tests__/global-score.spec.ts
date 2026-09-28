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

const noStats: CardStats = {
  attack: 0,
  defense: 0,
  health: 0,
  speed: 0,
  accuracy: 0,
  agility: 0,
  regeneration: 0,
  resistance: 0,
};

describe('computeGlobalScore', () => {
  it('reproduces the published score for Arionis', () => {
    const arionis = makeCard('Guerrier', {
      attack: 85,
      defense: 60,
      health: 550,
      speed: 75,
      accuracy: 80,
      agility: 55,
      regeneration: 45,
      resistance: 50,
    });
    expect(computeGlobalScore(arionis)).toBeCloseTo(332.8, 2);
  });

  it('reproduces the published score for Aegis', () => {
    const aegis = makeCard('Tank', {
      attack: 55,
      defense: 85,
      health: 650,
      speed: 50,
      accuracy: 60,
      agility: 35,
      regeneration: 55,
      resistance: 75,
    });
    expect(computeGlobalScore(aegis)).toBeCloseTo(284.75, 2);
  });

  it('reproduces the published score for Lysandra', () => {
    const lysandra = makeCard('Support', {
      attack: 55,
      defense: 45,
      health: 480,
      speed: 70,
      accuracy: 80,
      agility: 85,
      regeneration: 75,
      resistance: 65,
    });
    expect(computeGlobalScore(lysandra)).toBeCloseTo(278.8, 2);
  });

  it('applies the archetype modifier to a stat it lists', () => {
    const tank = makeCard('Tank', { ...noStats, health: 100 });
    // health weight 0.05 * Tank modifier 1.3 * 100 = 6.5
    expect(computeGlobalScore(tank)).toBeCloseTo(6.5, 2);
  });

  it('falls back to a 1.0 modifier for a stat the archetype does not list', () => {
    const tank = makeCard('Tank', { ...noStats, accuracy: 100 });
    // accuracy weight 0.5 * default modifier 1.0 * 100 = 50, Tank lists no accuracy entry
    expect(computeGlobalScore(tank)).toBeCloseTo(50, 2);
  });

  it('gives different scores to different archetypes with identical stats', () => {
    const stats: CardStats = { ...noStats, attack: 80, health: 500 };
    const asAssassin = computeGlobalScore(makeCard('Assassin', stats));
    const asSupport = computeGlobalScore(makeCard('Support', stats));
    expect(asAssassin).not.toBeCloseTo(asSupport, 0);
  });

  it('counts resistance towards the score', () => {
    const low = computeGlobalScore(
      makeCard('Guerrier', { ...noStats, resistance: 10 }),
    );
    const high = computeGlobalScore(
      makeCard('Guerrier', { ...noStats, resistance: 90 }),
    );
    expect(high - low).toBeCloseTo(32, 5);
  });

  it('counts regeneration towards the score', () => {
    const low = computeGlobalScore(
      makeCard('Guerrier', { ...noStats, regeneration: 10 }),
    );
    const high = computeGlobalScore(
      makeCard('Guerrier', { ...noStats, regeneration: 90 }),
    );
    expect(high - low).toBeCloseTo(32, 5);
  });

  it('values regeneration most for a Support', () => {
    const stats: CardStats = { ...noStats, regeneration: 100 };
    // 100 * 0.4 * 1.8 = 72, contre 0.5 pour un Assassin
    expect(computeGlobalScore(makeCard('Support', stats))).toBeCloseTo(72, 5);
  });

  it('values resistance most for a Tank', () => {
    const stats: CardStats = { ...noStats, resistance: 100 };
    // 100 * 0.4 * 1.3 = 52
    expect(computeGlobalScore(makeCard('Tank', stats))).toBeCloseTo(52, 5);
  });
});
