import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';
import { ConditionedAlteration } from '../conditioned-alteration';

export class HealthThresholdCondition implements ConditionedAlteration {
  public readonly id = 'health-threshold';

  constructor(
    private readonly threshold: number,
    private readonly operator: 'above' | 'below' = 'above',
  ) {}

  public evaluate(source: FightingCard, _context: FightingContext): boolean {
    if (this.operator === 'below') {
      return source.healthRatio < this.threshold;
    }
    return source.healthRatio > this.threshold;
  }
}
