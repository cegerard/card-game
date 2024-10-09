import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export class SpecialAttack {
  constructor(
    private readonly damageRate: number,
    private readonly energyNeeded: number,
    public readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public ready(energy: number): boolean {
    return energy >= this.energyNeeded;
  }

  public computeDamage(damage: number, isCritical: boolean): number {
    const damageMultiplier = isCritical ? 1.3 : 1;

    return damage * this.damageRate * damageMultiplier;
  }
}
