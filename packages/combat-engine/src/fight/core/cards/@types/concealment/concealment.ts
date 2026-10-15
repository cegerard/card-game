/**
 * A card out of the opponent's sight: no enemy targeting strategy returns it.
 * Without `remainingTurns` it lasts until the card attacks.
 */
export type Concealment = {
  name: string;
  remainingTurns?: number;
};
