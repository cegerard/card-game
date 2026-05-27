import { FightingCard } from '../../fighting-card';

export class HealthThresholdCondition {
  constructor(
    readonly operator: 'below' | 'above',
    readonly threshold: number,
  ) {}

  evaluate(card: FightingCard): boolean {
    return this.operator === 'below'
      ? card.healthRatio < this.threshold
      : card.healthRatio > this.threshold;
  }
}
