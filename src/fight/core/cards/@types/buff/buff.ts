import { BuffType } from './buff-type';

export interface Buff {
  type: BuffType;
  value: number;
  duration: number;
}
