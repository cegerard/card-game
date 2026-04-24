import { DebuffType } from './type';

export type Debuff = {
  type: DebuffType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};
