import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { SpecialResult } from '../@types/special-result';
import { FightingCard } from '../fighting-card';
import { Special } from './special';

const ENERGY_INCREASE_FACTOR = 10;
const CRITICAL_RATE = 1.3;
const DEFAULT_DAMAGE_RATE = 1;

export class SpecialAttack implements Special {
  constructor(
    private readonly damageRate: number,
    private readonly energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
  }

  public launch(source: FightingCard, target: FightingCard): SpecialResult {
    const isCritical = Math.random() < source.actualCriticalChance;

    if (target.dodge(source.actualAccuracy)) {
      return { damage: 0, isCritical, dodge: true };
    }

    const computedDamage = this.computeDamage(source.actualAttack, isCritical);
    const damage = target.collectsDamages(computedDamage);

    return { damage, isCritical, dodge: false };
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialAttack';
  }

  public getTargetingStrategy(): TargetingCardStrategy {
    return this.targetingStrategy;
  }

  private computeDamage(damage: number, isCritical: boolean): number {
    const damageMultiplier = isCritical ? CRITICAL_RATE : DEFAULT_DAMAGE_RATE;

    return Math.round(damage * this.damageRate * damageMultiplier);
  }
}
