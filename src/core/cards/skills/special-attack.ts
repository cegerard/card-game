import { FightingCard } from '../fighting-card';

export class SpecialAttack {
  constructor(
    private readonly damage,
    private readonly energyNeeded: number,
  ) {}

  public ready(energy: number): boolean {
    return energy >= this.energyNeeded;
  }

  public launch(isCritical: boolean): number {
    const damageMultiplier = isCritical ? 1.3 : 1;

    return this.damage * damageMultiplier;
  }
}
