export function assertConcealmentDuration(duration: number | undefined): void {
  if (duration !== undefined && (!Number.isInteger(duration) || duration < 0)) {
    throw new Error(
      `Concealment duration must be a non-negative integer, got ${duration}`,
    );
  }
}
