/**
 * A named combat posture a card holds for a number of turns. Skills can
 * require one, which is how an ability stays active only for the duration of
 * the power that opened it.
 */
export type Stance = {
  name: string;
  remainingTurns: number;
};

/** What a special declares to open a stance on its caster. */
export type StanceActivation = {
  name: string;
  duration: number;
};
