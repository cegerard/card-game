import { Randomizer } from '../../../../randomizer';
import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';
import { AlterationCondition } from '../alteration-condition';

/**
 * Rolls a chance every time it is evaluated, so a skill fires only a share of
 * the times its event fires. It is the activation chance of the skill itself,
 * the counterpart of `AttackEffect.probability` for event-driven skills, which
 * is why it reads neither the source nor the context.
 */
export class ProbabilityCondition implements AlterationCondition {
  public readonly id = 'probability';

  constructor(
    private readonly probability: number,
    private readonly randomizer: Randomizer,
  ) {
    if (probability < 0 || probability > 1) {
      throw new Error(`probability must be in [0, 1], got: ${probability}`);
    }
  }

  public evaluate(_source: FightingCard, _context: FightingContext): boolean {
    return this.randomizer.random() < this.probability;
  }
}
