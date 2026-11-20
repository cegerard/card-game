/**
 * Takes one turn off a timed buffer, the buff way: it runs while its
 * remaining turns stay at 0 or more. Returns the buffer left, or what ended.
 */
export function countDown<T extends { remainingTurns: number }>(
  buffer: T | null,
): { left: T | null; ended: T | null } {
  if (!buffer) return { left: null, ended: null };

  const remainingTurns = buffer.remainingTurns - 1;
  return remainingTurns < 0
    ? { left: null, ended: buffer }
    : { left: { ...buffer, remainingTurns }, ended: null };
}
