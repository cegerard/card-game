import { describe, it, expect } from 'vitest';
import {
  computeCardPower,
  computeTeamPower,
  computeDifficulty,
} from '../combat-power.js';
import { computeGlobalScore } from '../global-score.js';
import { applyExperience } from '$lib/experience/apply-experience.js';
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
  cardId: 'arionis',
  experience: 0,
  tier: 1,
};

describe('computeCardPower', () => {
  it('equals the global score when experience is zero', () => {
    expect(computeCardPower(arionis, noProgress)).toBeCloseTo(
      computeGlobalScore(arionis),
      5,
    );
  });

  it('exceeds the global score once experience is accumulated', () => {
    const progressed: CardProgression = {
      cardId: 'arionis',
      experience: 10000,
      tier: 2,
    };
    expect(computeCardPower(arionis, progressed)).toBeGreaterThan(
      computeGlobalScore(arionis),
    );
  });

  it('differs from naively chaining computeEffectiveStats into computeGlobalScore', () => {
    // computeEffectiveStats (étape 4) applique déjà le modificateur de rôle
    // au gain XP. Le composer avec computeGlobalScore l'appliquerait une
    // seconde fois — exactement le risque documenté que computeCardPower
    // évite en appliquant le modificateur une seule fois, à la pondération.
    const progression: CardProgression = {
      cardId: 'arionis',
      experience: 5000,
      tier: 1,
    };
    const naiveDoubleApplied = computeGlobalScore(
      applyExperience(arionis, progression),
    );
    const correct = computeCardPower(arionis, progression);
    expect(correct).not.toBeCloseTo(naiveDoubleApplied, 0);
  });

  it('caps a stat before weighting it, at high experience', () => {
    const highXp: CardProgression = {
      cardId: 'arionis',
      experience: 10_000_000,
      tier: 5,
    };
    // Vitesse plafonnée à 150 : puissance finie, pas de croissance infinie
    // sur cette seule stat.
    const power = computeCardPower(arionis, highXp);
    expect(power).toBeLessThan(1_000_000);
  });
});

describe('computeTeamPower', () => {
  it('sums the power of every card in the team', () => {
    const total = computeTeamPower([
      { definition: arionis, progression: noProgress },
      { definition: arionis, progression: noProgress },
    ]);
    expect(total).toBeCloseTo(computeGlobalScore(arionis) * 2, 5);
  });

  it('returns 0 for an empty team', () => {
    expect(computeTeamPower([])).toBe(0);
  });
});

describe('computeDifficulty', () => {
  it('returns 1 when both teams have equal power', () => {
    expect(computeDifficulty(300, 300)).toBe(1);
  });

  it('clamps at the floor of 0.5 for a much weaker opponent', () => {
    expect(computeDifficulty(10, 300)).toBe(0.5);
  });

  it('clamps at the ceiling of 2 for a much stronger opponent', () => {
    expect(computeDifficulty(3000, 300)).toBe(2);
  });

  it('returns an unclamped ratio within the bounds', () => {
    expect(computeDifficulty(360, 300)).toBeCloseTo(1.2, 5);
  });

  it('falls back to the ceiling when player power is zero', () => {
    expect(computeDifficulty(300, 0)).toBe(2);
  });
});
