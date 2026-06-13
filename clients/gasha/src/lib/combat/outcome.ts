import type { FightResult } from '$lib/arcade/types.js';

export function detectOutcome(steps: FightResult, playerName: string): 'victory' | 'game-over' {
  const fightEnd = Object.values(steps).find((s) => s.kind === 'fight_end');
  if (!fightEnd || fightEnd.kind !== 'fight_end') return 'game-over';
  return fightEnd.winner === playerName ? 'victory' : 'game-over';
}
