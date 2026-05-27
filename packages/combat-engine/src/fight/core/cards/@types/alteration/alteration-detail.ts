import { AlterationType } from './alteration-type';

type AlterationDetailBase = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};

export type Buff = AlterationDetailBase & { polarity: 'buff' };
export type Debuff = AlterationDetailBase & { polarity: 'debuff' };

export type AlterationDetail = Buff | Debuff;
