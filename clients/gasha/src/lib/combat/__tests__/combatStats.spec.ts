import { describe, it, expect } from 'vitest';
import { aggregateCombatStats } from '../combatStats.js';
import { attack, death, fightEnd, goblin, heal, healer, poisonTick, warrior } from './report-steps.js';

const playerCardIds = ['p1', 'p2'];

describe('aggregateCombatStats', () => {
  it('accumulates damage dealt from attack steps', () => {
    const stats = aggregateCombatStats({ 0: attack(warrior, goblin, 50) }, playerCardIds);
    expect(stats.playerCards[0].damageDealt).toBe(50);
  });

  it('accumulates damage taken from attack steps', () => {
    const stats = aggregateCombatStats({ 0: attack(warrior, goblin, 50) }, playerCardIds);
    expect(stats.enemyCards[0].damageTaken).toBe(50);
  });

  it('accumulates damage across multiple attack steps', () => {
    const result = { 0: attack(warrior, goblin, 30), 1: attack(warrior, goblin, 20) };
    const stats = aggregateCombatStats(result, playerCardIds);
    expect(stats.playerCards[0].damageDealt).toBe(50);
  });

  it('adds state effect damage to damageTaken', () => {
    const stats = aggregateCombatStats({ 0: poisonTick(warrior, 15) }, playerCardIds);
    expect(stats.playerCards[0].damageTaken).toBe(15);
  });

  it('accumulates healing done from healing steps', () => {
    const stats = aggregateCombatStats({ 0: heal(healer, warrior, 40) }, playerCardIds);
    const healerStats = stats.playerCards.find((c) => c.id === 'p2');
    expect(healerStats?.healingDone).toBe(40);
  });

  it('detects dead card from status_change step', () => {
    const stats = aggregateCombatStats({ 0: death(goblin) }, playerCardIds);
    expect(stats.enemyCards[0].isDead).toBe(true);
  });

  it('partitions cards into playerCards and enemyCards via playerCardIds', () => {
    const stats = aggregateCombatStats({ 0: attack(warrior, goblin, 10) }, playerCardIds);
    expect(stats.playerCards.every((c) => playerCardIds.includes(c.id))).toBe(true);
    expect(stats.enemyCards.every((c) => !playerCardIds.includes(c.id))).toBe(true);
  });

  it('extracts winner from fight_end step', () => {
    const stats = aggregateCombatStats({ 0: fightEnd('Player') }, playerCardIds);
    expect(stats.winner).toBe('Player');
  });

  it('does not count dodge hits toward damageTaken', () => {
    const stats = aggregateCombatStats({ 0: attack(warrior, goblin, 0, true) }, playerCardIds);
    const goblinStats = stats.enemyCards.find((c) => c.id === 'e1');
    expect(goblinStats?.damageTaken ?? 0).toBe(0);
  });
});
