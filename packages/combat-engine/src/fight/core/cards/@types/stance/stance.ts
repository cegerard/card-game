import { StatusCategory } from '../state/status-category';

/**
 * A named combat posture a card holds for a number of turns. Skills can
 * require one, which is how an ability stays active only for the duration of
 * the power that opened it, and it can carry status immunities granted for
 * that same duration.
 */
export type Stance = {
  name: string;
  remainingTurns: number;
  /** Status categories the bearer refuses while the stance runs. */
  immunities?: StatusCategory[];
};

/** What a special declares to open a stance on its caster. */
export type StanceActivation = {
  name: string;
  duration: number;
  immunities?: StatusCategory[];
};
