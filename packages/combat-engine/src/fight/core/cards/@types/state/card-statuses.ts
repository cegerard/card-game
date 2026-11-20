import type { CardInfo, StateEffectType } from '@card-game/shared-types';
import type { FightingCard } from '../../fighting-card';
import { StateResult } from '../action-result/state-result';
import { EffectLevel } from '../attack/effect-level';
import { CardState } from './card-state';
import { CardStateBleeding } from './card-state-bleeding';
import { CardStateEntangled } from './card-state-entangled';
import { CardStateFrozen } from './card-state-frozen';
import { CardStateStackedPoison } from './card-state-stacked-poison';
import { CardStateStunted } from './card-state-stunted';
import { Randomizer } from '../../../randomizer';

// The orders below are part of the fight report: the step order of the
// ticks and of the removals, and the draw of a random cleanse.
const TICK_ORDER: StateEffectType[] = [
  'freeze',
  'poison',
  'burn',
  'stunt',
  'bleed',
  'hypothermia',
];
const CLEANSE_ORDER: StateEffectType[] = [
  'poison',
  'burn',
  'freeze',
  'stunt',
  'bleed',
  'hypothermia',
  'entangle',
];
const REMOVAL_ORDER: StateEffectType[] = [
  'poison',
  'burn',
  'freeze',
  'stunt',
  'hypothermia',
  'entangle',
  'bleed',
];
// Statuses running on a turn count; a bleed runs on its stacks, an
// entanglement until the action it makes fail.
const TIMED: StateEffectType[] = [
  'freeze',
  'poison',
  'burn',
  'stunt',
  'hypothermia',
];

/** The statuses a card suffers, at most one of each type. */
export class CardStatuses {
  private readonly states = new Map<StateEffectType, CardState>();

  /**
   * Lays a status the card accepted: a bleed adds its stacks to the running
   * one, a stacked poison carries the running poison over, any other one
   * replaces the status of its type.
   */
  public lay(state: CardState): void {
    if (state instanceof CardStateStackedPoison) {
      state.carryOver(this.states.get('poison'));
    }
    if (state instanceof CardStateBleeding && this.bleeding) {
      this.bleeding.addStacks(state);
      return;
    }
    this.states.set(state.type, state);
  }

  public has(type: StateEffectType): boolean {
    return this.states.has(type);
  }

  public level(type: StateEffectType): EffectLevel {
    return this.states.get(type)?.level ?? 0;
  }

  public remove(type: StateEffectType): void {
    this.states.delete(type);
  }

  public clear(): void {
    this.states.clear();
  }

  public get bleeding(): CardStateBleeding | undefined {
    const bleeding = this.states.get('bleed');
    return bleeding instanceof CardStateBleeding ? bleeding : undefined;
  }

  public get stackedPoison(): CardStateStackedPoison | undefined {
    const poison = this.states.get('poison');
    return poison instanceof CardStateStackedPoison ? poison : undefined;
  }

  /** The entanglement goes with the action it may make fail. */
  public consumeEntanglement(): CardStateEntangled | undefined {
    const entangled = this.states.get('entangle');
    this.states.delete('entangle');
    return entangled instanceof CardStateEntangled ? entangled : undefined;
  }

  /** The extra damage a frozen or stunned card takes from a hit. */
  public amplify(damage: number): number {
    const frozen = this.states.get('freeze') as CardStateFrozen | undefined;
    const stunted = this.states.get('stunt') as CardStateStunted | undefined;
    const afterFreeze = frozen ? frozen.applyDamageRate(damage) : damage;

    return stunted ? stunted.applyDamageRate(afterFreeze) : afterFreeze;
  }

  /**
   * Ticks every status on `card` at its turn end, then drops the ones that
   * ran out. A stun does not tick through a freeze.
   */
  public tick(card: FightingCard): StateResult[] {
    const results: StateResult[] = [];
    for (const type of TICK_ORDER) {
      const state = this.states.get(type);
      if (!state || (type === 'stunt' && this.has('freeze'))) continue;
      results.push(state.applyState(card));
    }
    this.dropRunOut(card.isDead());

    return results.filter((result) => result !== undefined);
  }

  /** Removes one status picked at random; returns its type. */
  public cleanseRandom(randomizer: Randomizer): StateEffectType | undefined {
    const present = CLEANSE_ORDER.filter((type) => this.has(type));
    if (present.length === 0) return undefined;

    const type = present[Math.floor(randomizer.random() * present.length)];
    this.states.delete(type);
    return type;
  }

  /** Removes the statuses, or the bleed stacks, bound to that event. */
  public removeBoundTo(
    eventName: string,
    card: CardInfo,
  ): { type: StateEffectType; card: CardInfo }[] {
    return REMOVAL_ORDER.filter((type) =>
      this.removeIfBoundTo(type, eventName),
    ).map((type) => ({ type, card }));
  }

  private removeIfBoundTo(type: StateEffectType, eventName: string): boolean {
    const bleeding = this.bleeding;
    if (type === 'bleed') {
      if (!bleeding?.removeStacksBoundTo(eventName)) return false;
      if (!bleeding.stackCount) this.states.delete('bleed');
      return true;
    }
    if (this.states.get(type)?.terminationEvent !== eventName) return false;

    this.states.delete(type);
    return true;
  }

  // A dead card keeps its poison whatever its remaining turns: the death
  // cascade reads who laid it, and that must not depend on who killed it.
  private dropRunOut(dead: boolean): void {
    for (const type of TIMED) {
      const state = this.states.get(type);
      if (state && !state.remainingTurns && !(type === 'poison' && dead)) {
        this.states.delete(type);
      }
    }
    if (this.bleeding && !this.bleeding.stackCount) this.states.delete('bleed');
  }
}
