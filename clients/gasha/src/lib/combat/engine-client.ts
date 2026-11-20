import { PUBLIC_COMBAT_ENGINE_URL } from '$app/env/public';
import type {
  CardConfig,
  FightRequest,
  FightResult,
} from '$lib/arcade/types.js';

/** Nom du joueur dans la requête de combat, donc dans le rapport (vainqueur). */
export const PLAYER_NAME = 'Player';

export async function fetchFight(
  player1Deck: CardConfig[],
  player2Deck: CardConfig[],
  enemyName: string,
): Promise<FightResult> {
  const request: FightRequest = {
    player1: { name: PLAYER_NAME, deck: player1Deck },
    player2: { name: enemyName, deck: player2Deck },
    cardSelectorStrategy: 'speed-weighted',
  };
  const response = await fetch(`${PUBLIC_COMBAT_ENGINE_URL}/fight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Fight API error: ${response.status}`);
  }

  return response.json();
}
