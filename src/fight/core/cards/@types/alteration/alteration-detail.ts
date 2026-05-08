import { AlterationType } from './alteration-type';

export type AlterationDetail = {
  polarity: 'buff' | 'debuff';
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};

export type Buff = AlterationDetail & { polarity: 'buff' };
export type Debuff = AlterationDetail & { polarity: 'debuff' };
