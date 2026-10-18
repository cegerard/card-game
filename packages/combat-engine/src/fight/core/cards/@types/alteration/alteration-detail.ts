import { AlterationType } from './alteration-type';

type AlterationDetailBase = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
  /**
   * Name of the stack this alteration belongs to. Alterations of the same
   * polarity sharing it count together against the `maxStacks` of their
   * application, so two skills applying the same named alteration share one
   * budget, while unrelated alterations on the same stat keep their own.
   */
  stackId?: string;
};

export type Buff = AlterationDetailBase & { polarity: 'buff' };

export type Debuff = AlterationDetailBase & { polarity: 'debuff' };

export type AlterationDetail = Buff | Debuff;

/** Stack budget of a capped alteration: an application beyond it is refused. */
export type AlterationStacking = {
  id: string;
  maxStacks: number;
};
