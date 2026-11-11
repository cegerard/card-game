import { FightingCard } from '../../fighting-card';
import {
  AttackEffect,
  ENERGY_DRAINED_TYPE,
  EnergyDrainedResult,
} from './attack-effect';
import { FightingContext } from '../fighting-context';
import { Randomizer } from '../../../randomizer';

/**
 * Takes `rate` special energy away from the defender, never below 0. Nothing
 * lasts, so nothing refuses it; an empty gauge reports nothing.
 */
export class EnergyDrainAttackEffect implements AttackEffect {
  public readonly type = ENERGY_DRAINED_TYPE;

  constructor(
    public readonly rate: number,
    private readonly randomizer: Randomizer,
    public readonly probability?: number,
  ) {
    if (!Number.isInteger(rate) || rate < 1) {
      throw new Error(
        `Energy drain amount must be an integer >= 1, got ${rate}`,
      );
    }
  }

  public applyEffect(
    defender: FightingCard,
    _card: FightingCard,
    _context: FightingContext,
  ): EnergyDrainedResult {
    if (
      this.probability !== undefined &&
      this.randomizer.random() >= this.probability
    )
      return;
    if (defender.isDead()) return;

    const amount = defender.drainEnergy(this.rate);
    if (amount === 0) return;

    return {
      type: this.type,
      card: defender,
      amount,
      energy: defender.actualEnergy,
    };
  }
}
