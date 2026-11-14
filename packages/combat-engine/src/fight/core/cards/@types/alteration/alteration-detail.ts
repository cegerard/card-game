import { AlterationType } from './alteration-type';
import { LiveRate } from './live-rate';

type AlterationDetailBase = {
  type: AlterationType;
  value: number;
  duration: number;
  terminationEvent?: string;
  /**
   * Set, `terminationEvent` ends the alteration only when it is a hit that
   * cost the bearer strictly more than this share of its max health.
   */
  terminationDamageRate?: number;
  powerId?: string;
  /**
   * Name of the stack this alteration belongs to. Alterations of the same
   * polarity sharing it count together against the `maxStacks` of their
   * application, so two skills applying the same named alteration share one
   * budget, while unrelated alterations on the same stat keep their own.
   */
  stackId?: string;
  /** Set, the value follows the board: it is read from this rate at every stat read. */
  live?: LiveRate;
  /** The battlefield that laid it, which prolongs it when its caster falls. */
  origin?: string;
};

export type Buff = AlterationDetailBase & { polarity: 'buff' };

export type Debuff = AlterationDetailBase & { polarity: 'debuff' };

export type AlterationDetail = Buff | Debuff;

/** Stack budget of a capped alteration: an application beyond it is refused. */
export type AlterationStacking = {
  id: string;
  maxStacks: number;
};
