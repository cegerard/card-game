import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export class SimpleAttack {
  constructor(
    private readonly damageRate: number,
    public readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public computeDamage(damage: number, isCritical: boolean): number {
    const damageMultiplier = isCritical ? 1.3 : 1;

    return damage * this.damageRate * damageMultiplier;
  }
}
