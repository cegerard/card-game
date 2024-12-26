import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

const ENERGY_INCREASE_FACTOR = 10;
const CRITICAL_RATE = 1.3;
const DEFAULT_DAMAGE_RATE = 1;

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
    const damageMultiplier = isCritical ? CRITICAL_RATE : DEFAULT_DAMAGE_RATE;

    return Math.round(damage * this.damageRate * damageMultiplier);
  }

  public increaseEnergy(energy: number): number {
    return Math.min(energy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }
}
