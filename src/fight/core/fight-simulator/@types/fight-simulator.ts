import { FightResult } from './fight-result';

export interface FightSimulator {
  start(): FightResult;
}
