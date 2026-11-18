import { RateBasis } from '@card-game/shared-types';

/** Every basis a rate can be a share of, to refuse an unknown one early. */
export const RATE_BASES: readonly RateBasis[] = Object.values(RateBasis);
