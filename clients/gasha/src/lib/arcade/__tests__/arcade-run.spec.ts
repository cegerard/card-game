import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toCombatConfig } from '@card-game/shared-types';
import type { CardDefinition, CardInfo } from '@card-game/shared-types';
import { fightLevel, settleFight } from '../arcade-run.js';
import { ARCADE_LEVELS } from '../levels.js';
import type { ArcadeLevel, FightResult } from '../types.js';
import { CHARACTER_ROSTER } from '$lib/deck/roster.js';
import { createProgressionStore } from '$lib/progression/progression-store.js';
import { createInMemoryRepository } from '$lib/progression/__tests__/in-memory-repository.js';
import { attack, fightEnd } from '$lib/combat/__tests__/report-steps.js';

const hero = CHARACTER_ROSTER[0];
// Le même personnage en face : les deux équipes ont la même puissance.
const twin: CardDefinition = { ...hero, id: `${hero.id}-twin` };

const level = (index: number): ArcadeLevel => ({
  index,
  name: `Level ${index}`,
  enemyTeam: [twin],
});

const info = ({ id, name }: CardDefinition): CardInfo => ({
  id,
  name,
  deckIdentity: id,
});

const fight = (winner: string): FightResult => ({
  0: attack(info(hero), info(twin), 10),
  1: fightEnd(winner),
});

const settle = (index: number, winner: string, experience = 0) =>
  settleFight(
    level(index),
    fight(winner),
    [hero],
    createProgressionStore(
      createInMemoryRepository([{ cardId: hero.id, experience, tier: 1 }]),
    ),
  );

describe('settleFight', () => {
  it('credits the base XP against a team as strong as the deck', () => {
    expect(settle(1, 'Player').xpGains).toEqual([
      { cardId: hero.id, name: hero.name, gain: 100 },
    ]);
  });

  it('credits less XP once the deck outgrows the level', () => {
    expect(settle(1, 'Player', 500).xpGains[0].gain).toBeLessThan(100);
  });

  it('saves the credited XP in the progression', () => {
    const progression = createProgressionStore(createInMemoryRepository());
    settleFight(level(1), fight('Player'), [hero], progression);
    expect(progression.getProgression(hero.id).experience).toBe(100);
  });

  it('offers the next level after a victory', () => {
    expect(settle(1, 'Player').phase).toBe('victory');
  });

  it('clears the arcade after a victory on the last level', () => {
    expect(settle(ARCADE_LEVELS.length, 'Player').phase).toBe('final-victory');
  });

  it('ends the run on a defeat', () => {
    expect(settle(1, 'Level 1').phase).toBe('game-over');
  });
});

describe('fightLevel', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(fight('Player')),
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the level team as the opponent, under the level name', async () => {
    await fightLevel(level(2), [toCombatConfig(hero)]);
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.player2).toEqual({
      name: 'Level 2',
      deck: [toCombatConfig(twin)],
    });
  });
});
