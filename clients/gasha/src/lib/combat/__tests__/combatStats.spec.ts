import { describe, it, expect } from 'vitest';
import { aggregateCombatStats } from '../combatStats.js';
import type { FightResult } from '$lib/arcade/types.js';

const playerCardIds = ['p1', 'p2'];

describe('aggregateCombatStats', () => {
  it('accumulates damage dealt from attack steps', () => {
    const result: FightResult = {
      0: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 50, dodge: false }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.playerCards[0].damageDealt).toBe(50);
  });

  it('accumulates damage taken from attack steps', () => {
    const result: FightResult = {
      0: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 50, dodge: false }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.enemyCards[0].damageTaken).toBe(50);
  });

  it('accumulates damage across multiple attack steps', () => {
    const result: FightResult = {
      0: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 30, dodge: false }] },
      1: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 20, dodge: false }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.playerCards[0].damageDealt).toBe(50);
  });

  it('adds state effect damage to damageTaken', () => {
    const result: FightResult = {
      0: { kind: 'state_effect', card: { id: 'p1', name: 'Warrior' }, damage: 15 } as unknown as FightResult[number],
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.playerCards[0].damageTaken).toBe(15);
  });

  it('accumulates healing done from healing steps', () => {
    const result: FightResult = {
      0: { kind: 'healing', source: { id: 'p2', name: 'Healer' }, heal: [{ target: { id: 'p1', name: 'Warrior' }, healed: 40 }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    const healer = stats.playerCards.find((c) => c.id === 'p2');
    expect(healer?.healingDone).toBe(40);
  });

  it('detects dead card from status_change step', () => {
    const result: FightResult = {
      0: { kind: 'status_change', card: { id: 'e1', name: 'Goblin' }, status: 'dead' },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.enemyCards[0].isDead).toBe(true);
  });

  it('partitions cards into playerCards and enemyCards via playerCardIds', () => {
    const result: FightResult = {
      0: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 10, dodge: false }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.playerCards.every((c) => playerCardIds.includes(c.id))).toBe(true);
    expect(stats.enemyCards.every((c) => !playerCardIds.includes(c.id))).toBe(true);
  });

  it('extracts winner from fight_end step', () => {
    const result: FightResult = { 0: { kind: 'fight_end', winner: 'Player' } };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.winner).toBe('Player');
  });

  it('does not count dodge hits toward damageTaken', () => {
    const result: FightResult = {
      0: { kind: 'attack', attacker: { id: 'p1', name: 'Warrior' }, damages: [{ defender: { id: 'e1', name: 'Goblin' }, damage: 0, dodge: true }] },
    };
    const stats = aggregateCombatStats(result, playerCardIds);
    const goblin = stats.enemyCards.find((c) => c.id === 'e1');
    expect(goblin?.damageTaken ?? 0).toBe(0);
  });
});
