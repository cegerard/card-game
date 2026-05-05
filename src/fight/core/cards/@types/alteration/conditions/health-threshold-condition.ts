import { FightingCard } from '../../../fighting-card';
import { FightingContext } from '../../fighting-context';
import { AlterationCondition } from '../alteration-condition';

export class HealthThresholdCondition implements AlterationCondition {
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
