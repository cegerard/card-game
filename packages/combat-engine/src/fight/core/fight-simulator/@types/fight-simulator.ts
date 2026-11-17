import type { FightResult } from '@card-game/shared-types';

export interface FightSimulator {
  start(): FightResult;
}
