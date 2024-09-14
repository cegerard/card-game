export class FightingCard {
  private damage: number;
  private defense: number;
  private health: number;
  private speed: number;
  private criticalChance: number;

  constructor(stats: {
    damage: number;
    defense: number;
    health: number;
    speed: number;
    criticalChance: number;
  }) {
    this.damage = stats.damage;
    this.defense = stats.defense;
    this.health = stats.health;
    this.speed = stats.speed;
    this.criticalChance = stats.criticalChance;
  }

  public get actualHealth(): number {
    return this.health;
  }

  public attack(defender: FightingCard): { damage: number; isCritical: boolean } {
    const isCritical = Math.random() < this.criticalChance;
    const damageMultiplier = isCritical ? 2 : 1;
    const damage = defender.collectsDamages(this.damage * damageMultiplier);
    return { damage, isCritical };
  }

  public fasterThan(defender: FightingCard | null): boolean {
    return !defender || this.speed > defender.speed;
  }

  public isDead(): boolean {
    return this.health <= 0;
  }

  private collectsDamages(damage: number): number {
    const causedDamages = Math.max(0, damage - this.defense);
    this.health = Math.max(0, this.health - causedDamages);
    return causedDamages;
  }
}
