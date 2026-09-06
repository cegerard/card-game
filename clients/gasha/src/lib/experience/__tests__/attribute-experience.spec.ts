import { describe, it, expect } from 'vitest';
import {
  computeCombatResult,
  computeParticipation,
  computeXpGain,
  attributeExperience,
} from '../attribute-experience.js';
import { createProgressionStore } from '$lib/progression/progression-store.js';
import type {
  CardProgression,
  ProgressionRepository,
} from '$lib/progression/types.js';
import type { CombatStats } from '$lib/combat/combatStats.js';

function createInMemoryRepository(
  seed: CardProgression[] = [],
): ProgressionRepository {
  const store = new Map(seed.map((p) => [p.cardId, p]));
  return {
    get: (cardId) => store.get(cardId),
    getAll: () => [...store.values()],
    set: (progression) => {
      store.set(progression.cardId, progression);
    },
    reset: () => {
      store.clear();
    },
  };
}

describe('computeCombatResult', () => {
  it('returns the victory factor when the winner is the player', () => {
    expect(computeCombatResult('Player', 'Player')).toBe(1);
  });

  it('returns the defeat factor when the winner is the opponent', () => {
    expect(computeCombatResult('Enemy', 'Player')).toBe(0.3);
  });

  it('returns the defeat factor when there is no winner', () => {
    expect(computeCombatResult(null, 'Player')).toBe(0.3);
  });
});

describe('computeParticipation', () => {
  const playerCards: CombatStats['playerCards'] = [
    {
      id: 'arionis',
      name: 'Arionis',
      damageDealt: 10,
      damageTaken: 0,
      healingDone: 0,
      isDead: false,
    },
    {
      id: 'kaelion',
      name: 'Kaelion',
      damageDealt: 0,
      damageTaken: 50,
      healingDone: 0,
      isDead: true,
    },
  ];

  it('returns the survived factor for a card alive at the end', () => {
    expect(computeParticipation('arionis', playerCards)).toBe(1);
  });

  it('returns the KO factor for a card that died during the fight', () => {
    expect(computeParticipation('kaelion', playerCards)).toBe(0.5);
  });

  it('returns 0 for a card absent from the fielded stats (not engaged)', () => {
    expect(computeParticipation('sekhara', playerCards)).toBe(0);
  });
});

describe('computeXpGain', () => {
  it('multiplies XP base by result and participation with the default difficulty', () => {
    expect(computeXpGain(1, 1)).toBe(100);
  });

  it('applies a reduced gain on defeat', () => {
    expect(computeXpGain(0.3, 1)).toBeCloseTo(30, 5);
  });

  it('applies a reduced gain on KO participation', () => {
    expect(computeXpGain(1, 0.5)).toBe(50);
  });

  it('applies a custom difficulty factor when provided', () => {
    expect(computeXpGain(1, 1, 2)).toBe(200);
  });
});

describe('attributeExperience', () => {
  const playerCardIds = ['arionis', 'kaelion', 'sekhara'];

  const combatStats: CombatStats = {
    playerCards: [
      {
        id: 'arionis',
        name: 'Arionis',
        damageDealt: 10,
        damageTaken: 0,
        healingDone: 0,
        isDead: false,
      },
      {
        id: 'kaelion',
        name: 'Kaelion',
        damageDealt: 0,
        damageTaken: 50,
        healingDone: 0,
        isDead: true,
      },
      // 'sekhara' absent : non engagée
    ],
    enemyCards: [],
    winner: 'Player',
  };

  it('credits a full victory gain to a surviving card', () => {
    const store = createProgressionStore(createInMemoryRepository());
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('arionis').experience).toBe(100);
  });

  it('credits a reduced gain to a card that was KO', () => {
    const store = createProgressionStore(createInMemoryRepository());
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('kaelion').experience).toBe(50);
  });

  it('does not credit a card that was never engaged', () => {
    const store = createProgressionStore(createInMemoryRepository());
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('sekhara').experience).toBe(0);
  });

  it('reduces the gain on a defeat', () => {
    const store = createProgressionStore(createInMemoryRepository());
    attributeExperience(
      playerCardIds,
      { ...combatStats, winner: 'Enemy' },
      'Player',
      store,
    );
    expect(store.getProgression('arionis').experience).toBeCloseTo(30, 5);
  });

  it('adds to existing experience rather than overwriting it', () => {
    const store = createProgressionStore(
      createInMemoryRepository([
        { cardId: 'arionis', experience: 500, tier: 2 },
      ]),
    );
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('arionis').experience).toBe(600);
  });

  it('preserves the tier when crediting experience', () => {
    const store = createProgressionStore(
      createInMemoryRepository([
        { cardId: 'arionis', experience: 500, tier: 3 },
      ]),
    );
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('arionis').tier).toBe(3);
  });

  it('accumulates further after a second consecutive fight', () => {
    const store = createProgressionStore(createInMemoryRepository());
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    attributeExperience(playerCardIds, combatStats, 'Player', store);
    expect(store.getProgression('arionis').experience).toBe(200);
  });
});
