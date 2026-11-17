import type { FightResult, Step } from '$lib/arcade/types.js';

export function detectOutcome(steps: FightResult, playerName: string): 'victory' | 'game-over' {
  const all: Step[] = Object.values(steps);
  const fightEnd = all.find((s) => s.kind === 'fight_end');
  if (fightEnd?.kind !== 'fight_end') return 'game-over';
  return fightEnd.winner === playerName ? 'victory' : 'game-over';
}
