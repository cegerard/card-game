import type { BuffType } from '@card-game/shared-types';
import {
  AlterationDetail,
  AlterationStacking,
  Buff,
  Debuff,
} from './alteration-detail';
import { LiveRate } from './live-rate';

type Polarity = AlterationDetail['polarity'];

/** What an alteration carries besides its rate and its lifetime. */
export type AlterationOptions = {
  live?: LiveRate;
  origin?: string;
  terminationDamageRate?: number;
};

export type AlterationRequest = AlterationOptions & {
  type: BuffType;
  rate: number;
  duration: number;
  terminationEvent?: string;
  powerId?: string;
  stacking?: AlterationStacking;
};

export type RemovedAlteration = { type: BuffType; value: number };

/**
 * The buffs and debuffs a card carries. `valueOf` turns a rate into points of
 * the bearer base stat; `liveRate` reads a live rate on the bearer, again at
 * every read.
 */
export class CardAlterations {
  private buffs: Buff[] = [];
  private debuffs: Debuff[] = [];

  constructor(
    private readonly valueOf: (type: BuffType, rate: number) => number,
    private readonly liveRate: (live: LiveRate) => number,
  ) {}

  /** Whether the pile of that polarity already holds `maxStacks` alterations. */
  public isPileFull(
    polarity: Polarity,
    stacking?: AlterationStacking,
  ): boolean {
    if (!stacking) return false;
    return this.stacks(polarity, stacking.id) >= stacking.maxStacks;
  }

  public stacks(polarity: Polarity, stackId: string): number {
    return this.of(polarity).filter((a) => a.stackId === stackId).length;
  }

  /**
   * An event-bound buff outside any pile replaces the one of its type bound
   * to the same event rather than adding to it.
   */
  public addBuff(request: AlterationRequest): Buff {
    const buff: Buff = { polarity: 'buff', ...this.detail(request) };
    const replaced =
      request.terminationEvent && !request.stacking
        ? this.buffs.findIndex(
            (b) =>
              b.type === request.type &&
              b.terminationEvent === request.terminationEvent,
          )
        : -1;
    if (replaced >= 0) this.buffs[replaced] = buff;
    else this.buffs.push(buff);

    return buff;
  }

  public addDebuff(request: AlterationRequest): Debuff {
    const debuff: Debuff = { polarity: 'debuff', ...this.detail(request) };
    this.debuffs.push(debuff);

    return debuff;
  }

  /** Points of that stat the alterations of that polarity add up to now. */
  public total(polarity: Polarity, type: BuffType): number {
    return this.of(polarity)
      .filter((alteration) => alteration.type === type)
      .reduce(
        (sum, alteration) =>
          sum +
          (alteration.live
            ? this.valueOf(type, this.liveRate(alteration.live))
            : alteration.value),
        0,
      );
  }

  /** `hitRate`: share of its max health the hit that fired the event cost the bearer. */
  public removeBoundTo(
    polarity: Polarity,
    eventName: string,
    hitRate?: number,
  ): RemovedAlteration[] {
    const ends = (a: AlterationDetail) => endsOn(a, eventName, hitRate);
    const removed = this.of(polarity)
      .filter(ends)
      .map((a) => ({ type: a.type, value: a.value }));
    this.keep(polarity, (a) => !ends(a));

    return removed;
  }

  public decreaseDurations(): {
    expiredBuffs: Buff[];
    expiredDebuffs: Debuff[];
  } {
    const buffs = this.buffs.map((b) => ({ ...b, duration: b.duration - 1 }));
    const debuffs = this.debuffs.map((d) => ({
      ...d,
      duration: d.duration - 1,
    }));
    this.buffs = buffs.filter((b) => b.duration >= 0);
    this.debuffs = debuffs.filter((d) => d.duration >= 0);

    return {
      expiredBuffs: buffs.filter((b) => b.duration < 0),
      expiredDebuffs: debuffs.filter((d) => d.duration < 0),
    };
  }

  /** Removes and returns every buff of that type, to hand it to another card. */
  public takeBuffs(type: BuffType): Buff[] {
    const taken = this.buffs.filter((b) => b.type === type);
    this.buffs = this.buffs.filter((b) => b.type !== type);
    return taken;
  }

  /** Takes buffs as they are: value, remaining duration and stack pile. */
  public receiveBuffs(buffs: Buff[]): void {
    this.buffs.push(...buffs.map((buff) => ({ ...buff })));
  }

  /** Makes the alterations a battlefield laid last `turns` more. */
  public extend(origin: string, turns: number): void {
    [...this.buffs, ...this.debuffs]
      .filter((a) => a.origin === origin)
      .forEach((a) => (a.duration += turns));
  }

  public removeFrom(origin: string): void {
    this.buffs = this.buffs.filter((b) => b.origin !== origin);
    this.debuffs = this.debuffs.filter((d) => d.origin !== origin);
  }

  public clear(): void {
    this.buffs = [];
    this.debuffs = [];
  }

  private detail({
    type,
    rate,
    duration,
    terminationEvent,
    powerId,
    stacking,
    live,
    origin,
    terminationDamageRate,
  }: AlterationRequest): Omit<AlterationDetail, 'polarity'> {
    return {
      type,
      value: this.valueOf(type, live ? this.liveRate(live) : rate),
      duration,
      terminationEvent,
      powerId,
      stackId: stacking?.id,
      live,
      origin,
      terminationDamageRate,
    };
  }

  private of(polarity: Polarity): AlterationDetail[] {
    return polarity === 'buff' ? this.buffs : this.debuffs;
  }

  private keep(
    polarity: Polarity,
    predicate: (alteration: AlterationDetail) => boolean,
  ): void {
    if (polarity === 'buff') this.buffs = this.buffs.filter(predicate);
    else this.debuffs = this.debuffs.filter(predicate);
  }
}

function endsOn(
  alteration: AlterationDetail,
  eventName: string,
  hitRate?: number,
): boolean {
  if (alteration.terminationEvent !== eventName) return false;
  if (alteration.terminationDamageRate === undefined) return true;

  return (hitRate ?? 0) > alteration.terminationDamageRate;
}
