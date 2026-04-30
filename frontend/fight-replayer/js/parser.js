/**
 * Fight Replayer — Data Parser
 *
 * Transforms a raw fight-result JSON object into:
 *   - events[]     — sorted array of step objects
 *   - snapshots[]  — card-state after each event (index 0 = initial)
 *   - teams        — { A: { ids: Set, name }, B: { ids: Set, name } }
 *   - cardsMeta    — { [id]: { id, name, deckIdentity } }
 */

// ── Card discovery helpers ─────────────────────────────────────

function registerCard(meta, c) {
  if (!c?.id || meta[c.id]) return;
  meta[c.id] = { id: c.id, name: c.name, deckIdentity: c.deckIdentity ?? '' };
}

function trackFirstHP(firstHP, card, remaining, damage) {
  if (!card?.id || firstHP[card.id] !== undefined) return;
  firstHP[card.id] = (remaining ?? 0) + (damage ?? 0);
}

function discoverCards(events) {
  const meta = {};
  const firstHP = {};

  events.forEach(ev => {
    registerCard(meta, ev.attacker);
    registerCard(meta, ev.source);
    registerCard(meta, ev.card);
    ev.damages?.forEach(d => {
      registerCard(meta, d.defender);
      trackFirstHP(firstHP, d.defender, d.remainingHealth, d.damage);
    });
    ev.heal?.forEach(h => registerCard(meta, h.target));
    ev.buffs?.forEach(b => registerCard(meta, b.target));
    ev.debuffs?.forEach(b => registerCard(meta, b.target));
    ev.removed?.forEach(r => registerCard(meta, r.target));
    if (ev.kind === 'state_effect') {
      trackFirstHP(firstHP, ev.card, ev.remainingHealth, ev.damage);
    }
  });

  return { meta, firstHP };
}

// ── Team detection ─────────────────────────────────────────────

function detectTeams(cardsMeta, events) {
  const ids = Object.keys(cardsMeta);

  // Strategy 1: group by deckIdentity prefix (strip trailing "-N" or " N")
  const groups = {};
  ids.forEach(id => {
    const identity = cardsMeta[id]?.deckIdentity;
    if (identity) {
      const base = identity.replace(/[-\s]\d+$/, '').trim() || identity;
      (groups[base] = groups[base] ?? []).push(id);
    }
  });

  const groupNames = Object.keys(groups);
  if (groupNames.length >= 2) {
    const nameA = groupNames[0];
    const nameB = groupNames.length === 2 ? groupNames[1] : groupNames.slice(1).join(' & ');
    const idsB = groupNames.slice(1).flatMap(n => groups[n]);
    return {
      A: { ids: new Set(groups[nameA]), name: nameA },
      B: { ids: new Set(idsB), name: nameB },
    };
  }

  // Strategy 2: attack-graph colouring (BFS)
  const teamA = new Set();
  const teamB = new Set();
  const visited = new Set();

  const firstAttack = events.find(e => e.kind === 'attack' || e.kind === 'special_attack');
  const seed = firstAttack?.attacker?.id;

  if (seed) {
    teamA.add(seed);
    visited.add(seed);
    const queue = [{ id: seed, side: teamA, other: teamB }];

    while (queue.length) {
      const { id, side, other } = queue.shift();
      events.forEach(ev => {
        if (ev.kind !== 'attack' && ev.kind !== 'special_attack') return;
        if (ev.attacker?.id === id) {
          ev.damages?.forEach(d => {
            const did = d.defender?.id;
            if (did && !visited.has(did)) {
              visited.add(did);
              other.add(did);
              queue.push({ id: did, side: other, other: side });
            }
          });
        }
      });
    }
  }

  ids.forEach(id => {
    if (!teamA.has(id) && !teamB.has(id)) teamA.add(id);
  });

  return {
    A: { ids: teamA, name: 'Team 1' },
    B: { ids: teamB, name: 'Team 2' },
  };
}

// ── State building ─────────────────────────────────────────────

function buildInitialState(cardsMeta, firstHP) {
  const state = {};
  Object.values(cardsMeta).forEach(c => {
    const maxHP = firstHP[c.id] ?? 1000;
    state[c.id] = {
      id: c.id,
      name: c.name,
      deckIdentity: c.deckIdentity,
      maxHP,
      hp: maxHP,
      statuses: [],     // active status names: ['burn', 'poison', ...]
      stateEffects: {}, // { [type]: remainingTurns }
      buffs: [],        // { kind, value, turns, name, powerId }
      debuffs: [],      // { kind, value, turns, name, powerId }
      dead: false,
    };
  });
  return state;
}

function applyEvent(state, ev) {
  const get = id => state[id];

  switch (ev.kind) {
    case 'attack':
    case 'special_attack':
      ev.damages?.forEach(d => {
        const c = get(d.defender?.id);
        if (c) c.hp = d.remainingHealth;
      });
      break;

    case 'healing':
      ev.heal?.forEach(h => {
        const c = get(h.target?.id);
        if (c) c.hp = h.remainingHealth;
      });
      break;

    case 'state_effect': {
      const c = get(ev.card?.id);
      if (!c) break;
      c.hp = ev.remainingHealth;
      if (ev.remainingTurns <= 0) {
        c.statuses = c.statuses.filter(s => s !== ev.type);
        delete c.stateEffects[ev.type];
      } else {
        c.stateEffects[ev.type] = ev.remainingTurns;
      }
      break;
    }

    case 'status_change': {
      const c = get(ev.card?.id);
      if (!c) break;
      if (ev.status === 'dead') {
        c.dead = true;
        c.hp = 0;
        c.buffs = [];
        c.debuffs = [];
        c.statuses = [];
        c.stateEffects = {};
      } else if (!c.statuses.includes(ev.status)) {
        c.statuses = [...c.statuses, ev.status];
      }
      break;
    }

    case 'buff':
      ev.buffs?.forEach(b => {
        const c = get(b.target?.id);
        if (!c) return;
        c.buffs = [...c.buffs, {
          kind: b.kind,
          value: b.value,
          turns: b.remainingTurns,
          name: ev.name ?? '',
          powerId: ev.powerId ?? null,
        }];
      });
      break;

    case 'debuff':
      ev.debuffs?.forEach(b => {
        const c = get(b.target?.id);
        if (!c) return;
        c.debuffs = [...c.debuffs, {
          kind: b.kind,
          value: b.value,
          turns: b.remainingTurns,
          name: ev.name ?? '',
          powerId: ev.powerId ?? null,
        }];
      });
      break;

    case 'buff_expired': {
      const c = get(ev.card?.id);
      if (!c) break;
      (ev.expired ?? []).forEach(e => {
        const idx = c.buffs.findIndex(b => b.kind === e.kind);
        if (idx !== -1) c.buffs.splice(idx, 1);
      });
      break;
    }

    case 'debuff_expired': {
      const c = get(ev.card?.id);
      if (!c) break;
      (ev.expired ?? []).forEach(e => {
        const idx = c.debuffs.findIndex(b => b.kind === e.kind);
        if (idx !== -1) c.debuffs.splice(idx, 1);
      });
      break;
    }

    case 'buff_removed':
      (ev.removed ?? []).forEach(r => {
        const c = get(r.target?.id);
        if (!c) return;
        const idx = c.buffs.findIndex(b => b.kind === r.kind);
        if (idx !== -1) c.buffs.splice(idx, 1);
      });
      if (ev.powerId) {
        Object.values(state).forEach(c => {
          c.buffs = c.buffs.filter(b => b.powerId !== ev.powerId);
        });
      }
      break;

    case 'debuff_removed':
      (ev.removed ?? []).forEach(r => {
        const c = get(r.target?.id);
        if (!c) return;
        const idx = c.debuffs.findIndex(b => b.kind === r.kind);
        if (idx !== -1) c.debuffs.splice(idx, 1);
      });
      break;

    case 'effect_removed':
      (ev.removed ?? []).forEach(r => {
        const c = get(r.target?.id);
        if (!c) return;
        c.statuses = c.statuses.filter(s => s !== r.effectType);
        delete c.stateEffects[r.effectType];
      });
      if (ev.powerId) {
        Object.values(state).forEach(c => {
          c.buffs = c.buffs.filter(b => b.powerId !== ev.powerId);
        });
      }
      break;

    // targeting_override / targeting_reverted don't mutate card stats
    default: break;
  }
}

// ── Public API ─────────────────────────────────────────────────

/**
 * Parse a raw fight-result JSON object.
 * @param {Object} rawJson — { "1": { kind, ... }, "2": { ... }, ... }
 * @returns {{ events, snapshots, teams, cardsMeta }}
 */
export function parseReport(rawJson) {
  const events = Object.entries(rawJson)
    .sort(([a], [b]) => +a - +b)
    .map(([k, v]) => ({ _step: +k, ...v }));

  const { meta: cardsMeta, firstHP } = discoverCards(events);
  const teams = detectTeams(cardsMeta, events);

  // Build snapshot array: index 0 = before any event
  const snapshots = [];
  let cur = buildInitialState(cardsMeta, firstHP);
  snapshots.push(JSON.parse(JSON.stringify(cur)));

  events.forEach(ev => {
    cur = JSON.parse(JSON.stringify(cur));
    applyEvent(cur, ev);
    snapshots.push(JSON.parse(JSON.stringify(cur)));
  });

  return { events, snapshots, teams, cardsMeta };
}
