import { DebuffType } from './type';

export type Debuff = {
  type: DebuffType;
  value: number;
  duration: number;
  powerId?: string;
};
