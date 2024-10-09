import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { SimpleAttack } from './skills/simple-attack';
import { SpecialAttack } from './skills/special-attack';

export class FightingCard {
  public readonly name: string;
  private damage: number;
  private defense: number;
  private health: number;
  private speed: number;
  private criticalChance: number;
  private simpleAttack: SimpleAttack;
  private specialAttack: SpecialAttack;
  private specialAttackEnergy: number = 0;

  constructor(
    name: string,
    stats: {
      damage: number;
      defense: number;
      health: number;
      speed: number;
      criticalChance: number;
    },
    skills: {
      simpleAttack: SimpleAttack;
      specialAttack: SpecialAttack;
    },
  ) {
    this.name = name;
    this.damage = stats.damage;
    this.defense = stats.defense;
    this.health = stats.health;
    this.speed = stats.speed;
    this.criticalChance = stats.criticalChance;
    this.simpleAttack = skills.simpleAttack;
    this.specialAttack = skills.specialAttack;
  }

  public get actualHealth(): number {
    return this.health;
  }

  public get actualSpeed(): number {
    return this.speed;
  }

  public attack(defender: FightingCard): {
    damage: number;
    isCritical: boolean;
  } {
    const isCritical = Math.random() < this.criticalChance;
    const computedDamage = this.simpleAttack.computeDamage(
      this.damage,
      isCritical,
    );
    const damage = defender.collectsDamages(computedDamage);

    this.specialAttackEnergy += 10;

    return { damage, isCritical };
  }

  public launchSpecialAttack(defender: FightingCard): {
    damage: number;
    isCritical: boolean;
  } {
    const isCritical = Math.random() < this.criticalChance;
    const computedDamage = this.specialAttack.computeDamage(
      this.damage,
      isCritical,
    );
    const damage = defender.collectsDamages(computedDamage);

    this.specialAttackEnergy = 0;

    return { damage, isCritical };
  }

  public fasterThan(defender: FightingCard | null): boolean {
    return !defender || this.speed > defender.speed;
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  public isSpecialAttackReady(): boolean {
    return this.specialAttack.ready(this.specialAttackEnergy);
  }

  public specialAttackTargeting(): TargetingCardStrategy {
    return this.specialAttack.targetingStrategy;
  }

  public simpleAttackTargeting(): TargetingCardStrategy {
    return this.simpleAttack.targetingStrategy;
  }

  private collectsDamages(damage: number): number {
    const causedDamages = Math.max(0, damage - this.defense);
    this.health = Math.max(0, this.health - causedDamages);
    return causedDamages;
  }
}
