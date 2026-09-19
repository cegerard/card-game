import { AlterationType } from './alteration-type';

type AlterationDetailBase = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
};

export type Buff = AlterationDetailBase & { polarity: 'buff' };

export type Debuff = AlterationDetailBase & {
  polarity: 'debuff';
  /**
   * Name of the stack this debuff belongs to. Debuffs sharing it count
   * together against the `maxStacks` of their application, so two skills
   * applying the same named debuff share one budget, while unrelated debuffs
   * on the same stat keep their own.
   */
  stackId?: string;
};

export type AlterationDetail = Buff | Debuff;

/** Stack budget of a capped debuff: an application beyond it is refused. */
export type DebuffStacking = {
  id: string;
  maxStacks: number;
};
