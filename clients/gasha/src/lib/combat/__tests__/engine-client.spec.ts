import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CHARACTER_ROSTER } from '$lib/deck/roster.js';
import type { CardConfig, FightResult } from '$lib/arcade/types.js';

const PLAYER_DECK = CHARACTER_ROSTER.slice(0, 5);

describe('fetchFight', () => {
  let fetchFight: (
    player1Deck: CardConfig[],
    player2Deck: CardConfig[],
    enemyName: string,
  ) => Promise<FightResult>;

  beforeEach(async () => {
    const mod = await import('../engine-client.js');
    fetchFight = mod.fetchFight;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /fight with correct payload', async () => {
    const mockResult: FightResult = {
      0: { kind: 'fight_end', winner: 'Player' },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResult),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchFight(PLAYER_DECK, [], 'Level 1');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/fight'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining(
          '"cardSelectorStrategy":"speed-weighted"',
        ),
      }),
    );
  });

  it('includes player1 name "Player" and player1 deck in payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ 0: { kind: 'fight_end' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchFight(PLAYER_DECK, [], 'Level 1');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);

    expect(body.player1.name).toBe('Player');
  });

  it('returns FightResult on 200', async () => {
    const mockResult: FightResult = {
      0: { kind: 'fight_end', winner: 'Player' },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      }),
    );

    const result = await fetchFight(PLAYER_DECK, [], 'Level 1');

    expect(result).toEqual(mockResult);
  });

  it('throws Error on non-200 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 400 }),
    );

    await expect(fetchFight(PLAYER_DECK, [], 'Level 1')).rejects.toThrow();
  });

  it('throws Error on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error')),
    );

    await expect(fetchFight(PLAYER_DECK, [], 'Level 1')).rejects.toThrow(
      'Network error',
    );
  });
});
