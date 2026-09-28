import { describe, it, expect } from 'vitest';
import { parseReport } from '../parser.js';

const AEGIS = { id: 'aegis', name: 'Aegis', deckIdentity: 'P1-1' };
const BAROS = { id: 'baros', name: 'Baros', deckIdentity: 'P1-2' };
const KAITO = { id: 'kaito', name: 'Kaito', deckIdentity: 'P2-1' };

/** Snapshot of `cardId` after the whole report has been replayed. */
function finalState(steps, cardId) {
  const { snapshots } = parseReport(steps);
  return snapshots[snapshots.length - 1][cardId];
}

function hit(defender, damage, remainingHealth, extra = {}) {
  return {
    kind: 'attack',
    name: 'Strike',
    attacker: KAITO,
    damages: [
      {
        defender,
        damage,
        isCritical: false,
        dodge: false,
        remainingHealth,
        ...extra,
      },
    ],
    energy: 0,
  };
}

const shielded = {
  1: hit(AEGIS, 100, 500),
  2: {
    kind: 'shield_applied',
    name: 'Forteresse des Âges',
    source: AEGIS,
    targets: [{ target: AEGIS, points: 200 }],
  },
};

describe('shield tracking', () => {
  it('holds the shield at its applied points before any hit lands on it', () => {
    expect(finalState(shielded, 'aegis').shield.points).toBe(200);
  });

  it('decrements the shield by what the hit absorbed', () => {
    const steps = {
      ...shielded,
      3: hit(AEGIS, 80, 500, { shieldAbsorbed: 80 }),
    };

    expect(finalState(steps, 'aegis').shield.points).toBe(120);
  });

  it('decrements once per hit', () => {
    const steps = {
      ...shielded,
      3: hit(AEGIS, 50, 500, { shieldAbsorbed: 50 }),
      4: hit(AEGIS, 30, 500, { shieldAbsorbed: 30 }),
    };

    expect(finalState(steps, 'aegis').shield.points).toBe(120);
  });

  it('drops the shield when a hit absorbs the last of it', () => {
    const steps = {
      ...shielded,
      3: hit(AEGIS, 200, 500, { shieldAbsorbed: 200 }),
    };

    expect(finalState(steps, 'aegis').shield).toBeNull();
  });

  it('leaves the shield alone for a hit that absorbed nothing', () => {
    const steps = { ...shielded, 3: hit(AEGIS, 80, 420) };

    expect(finalState(steps, 'aegis').shield.points).toBe(200);
  });

  it('drops the shield on shield_broken', () => {
    const steps = { ...shielded, 3: { kind: 'shield_broken', card: AEGIS } };

    expect(finalState(steps, 'aegis').shield).toBeNull();
  });

  it('drops the shield on shield_expired', () => {
    const steps = { ...shielded, 3: { kind: 'shield_expired', card: AEGIS } };

    expect(finalState(steps, 'aegis').shield).toBeNull();
  });
});

describe('regeneration', () => {
  it('raises the card health to the reported value', () => {
    const steps = {
      1: hit(AEGIS, 100, 500),
      2: { kind: 'regenerated', card: AEGIS, healed: 55, remainingHealth: 555 },
    };

    expect(finalState(steps, 'aegis').hp).toBe(555);
  });
});

describe('stance', () => {
  it('holds the stance the special opened', () => {
    const steps = {
      1: hit(AEGIS, 100, 500),
      2: {
        kind: 'stance_started',
        name: 'forteresse-des-ages',
        card: AEGIS,
        remainingTurns: 3,
      },
    };

    expect(finalState(steps, 'aegis').stance).toEqual({
      name: 'forteresse-des-ages',
      turns: 3,
    });
  });

  it('clears the stance when it ends', () => {
    const steps = {
      1: hit(AEGIS, 100, 500),
      2: {
        kind: 'stance_started',
        name: 'forteresse-des-ages',
        card: AEGIS,
        remainingTurns: 3,
      },
      3: { kind: 'stance_ended', name: 'forteresse-des-ages', card: AEGIS },
    };

    expect(finalState(steps, 'aegis').stance).toBeNull();
  });
});

describe('protection', () => {
  const started = {
    1: hit(AEGIS, 100, 500),
    2: hit(BAROS, 100, 500),
    3: {
      kind: 'protection_started',
      name: 'Gardien Éternel',
      card: AEGIS,
      protectedCard: BAROS,
      remainingTurns: 2,
    },
  };

  it('records who the guardian covers', () => {
    expect(finalState(started, 'aegis').protecting).toEqual({
      name: 'Gardien Éternel',
      target: 'Baros',
      turns: 2,
    });
  });

  it('clears the protection when it ends', () => {
    const steps = {
      ...started,
      4: { kind: 'protection_ended', card: AEGIS, protectedCard: BAROS },
    };

    expect(finalState(steps, 'aegis').protecting).toBeNull();
  });

  it('registers a protected card never seen anywhere else', () => {
    const steps = {
      1: hit(AEGIS, 100, 500),
      2: {
        kind: 'protection_started',
        name: 'Gardien Éternel',
        card: AEGIS,
        protectedCard: BAROS,
        remainingTurns: 2,
      },
    };
    const { cardsMeta } = parseReport(steps);

    expect(cardsMeta.baros?.name).toBe('Baros');
  });
});

describe('death', () => {
  it('clears the shield, the stance and the protection of a dead card', () => {
    const steps = {
      1: hit(AEGIS, 100, 500),
      2: {
        kind: 'shield_applied',
        source: AEGIS,
        targets: [{ target: AEGIS, points: 200 }],
      },
      3: {
        kind: 'stance_started',
        name: 'forteresse-des-ages',
        card: AEGIS,
        remainingTurns: 3,
      },
      4: { kind: 'status_change', card: AEGIS, status: 'dead' },
    };
    const aegis = finalState(steps, 'aegis');

    expect([aegis.shield, aegis.stance, aegis.protecting]).toEqual([
      null,
      null,
      null,
    ]);
  });
});
