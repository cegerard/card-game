import { AlterationType } from './alteration-type';

export type Buff = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};
