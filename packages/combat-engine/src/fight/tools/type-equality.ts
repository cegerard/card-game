/** Compile-time check: `Assert<Equal<A, B>>` fails the build unless A and B are the same type. */
export type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

export type Assert<T extends true> = T;
