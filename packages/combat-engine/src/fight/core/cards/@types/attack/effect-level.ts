export type EffectLevel = 0 | 1 | 2 | 3;

/** Turns a level status lasts: an explicit `duration` replaces 2 × level − 1. */
export function levelTurns(level: EffectLevel, duration?: number): number {
  return duration ?? 2 * level - 1;
}

export function assertLevelDuration(effect: string, duration?: number): void {
  if (
    duration !== undefined &&
    !(Number.isInteger(duration) && duration >= 1)
  ) {
    throw new Error(
      `${effect} duration must be an integer >= 1, got ${duration}`,
    );
  }
}
