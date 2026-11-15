/**
 * Every roll of a fight draws from this source, Math.random() by default.
 *
 * A fight runs synchronously from the request to its result, so swapping the
 * source for that span scopes a seed to one fight without threading it
 * through every factory, and no other request can interleave with it.
 */
let source: () => number = () => Math.random();

export function random(): number {
  return source();
}

export function withRandomSource<T>(next: () => number, run: () => T): T {
  const previous = source;
  source = next;
  try {
    const result = run();
    if (result instanceof Promise) {
      throw new Error(
        'A fight with its own random source must run synchronously',
      );
    }
    return result;
  } finally {
    source = previous;
  }
}
