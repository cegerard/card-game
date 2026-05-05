import { AlterationType } from './alteration-type';

export type AlterationDetail = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};
