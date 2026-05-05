import { AlterationType } from './alteration-type';

export type Debuff = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};
