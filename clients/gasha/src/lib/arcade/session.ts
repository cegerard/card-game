import { writable } from 'svelte/store';
import type { ArcadeSession } from './types.js';

const INITIAL_STATE: ArcadeSession = {
  currentLevel: 1,
  phase: 'idle',
  fightResult: null,
};

export const session = writable<ArcadeSession>({ ...INITIAL_STATE });

export function resetSession(): void {
  session.set({ ...INITIAL_STATE });
}
