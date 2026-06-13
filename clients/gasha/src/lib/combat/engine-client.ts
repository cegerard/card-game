import { PUBLIC_COMBAT_ENGINE_URL } from '$env/static/public';
import type { CardConfig, FightResult } from '$lib/arcade/types.js';

export async function fetchFight(
  player1Deck: CardConfig[],
  player2Deck: CardConfig[],
  enemyName: string,
): Promise<FightResult> {
  const response = await fetch(`${PUBLIC_COMBAT_ENGINE_URL}/fight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      player1: { name: 'Player', deck: player1Deck },
      player2: { name: enemyName, deck: player2Deck },
      cardSelectorStrategy: 'speed-weighted',
    }),
  });

  if (!response.ok) {
    throw new Error(`Fight API error: ${response.status}`);
  }

  return response.json();
}
