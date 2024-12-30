import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { CardInfo } from './@types/card-info';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { SimpleAttack } from './skills/simple-attack';
import { SpecialAttack } from './skills/special-attack';

export class FightingCard {
  // Info
  public readonly name: string;
  private cardDeckIdentity: string = '';

  // Stats
  private damage: number;
  private defense: number;
  private health: number;
  private speed: number;
  private agility: number;
  private accuracy: number;
  private criticalChance: number;
  private specialAttackEnergy: number = 0;

  // Skills
  private simpleAttack: SimpleAttack;
  private specialAttack: SpecialAttack;

  // Behaviors
  private dodgeBehavior: DodgeBehavior;

  constructor(
    name: string,
    stats: {
      damage: number;
      defense: number;
      health: number;
      speed: number;
      agility: number;
      accuracy: number;
      criticalChance: number;
    },
    skills: {
      simpleAttack: SimpleAttack;
      specialAttack: SpecialAttack;
    },
    behaviors: {
      dodge: DodgeBehavior;
    },
  ) {
    this.name = name;
    this.damage = stats.damage;
    this.defense = stats.defense;
    this.health = stats.health;
    this.speed = stats.speed;
    this.agility = stats.agility;
    this.accuracy = stats.accuracy;
    this.criticalChance = stats.criticalChance;
    this.simpleAttack = skills.simpleAttack;
    this.specialAttack = skills.specialAttack;
    this.dodgeBehavior = behaviors.dodge;
  }

  public get actualHealth(): number {
    return this.health;
  }

  public get actualSpeed(): number {
    return this.speed;
  }

  public get identityInfo(): CardInfo {
    return { name: this.name, deckIdentity: this.cardDeckIdentity };
  }

  public setOwnerInfo(ownerName: string, cardPositionInDeck: number): void {
    this.cardDeckIdentity = `${ownerName}-${cardPositionInDeck}`;
  }

  public attack(defender: FightingCard): {
    damage: number;
    isCritical: boolean;
  } {
    const isCritical = Math.random() < this.criticalChance;

    if (defender.dodge(this.accuracy)) {
      return { damage: 0, isCritical };
    }

    const computedDamage = this.simpleAttack.computeDamage(
      this.damage,
      isCritical,
    );
    const damage = defender.collectsDamages(computedDamage);

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

  public increaseSpecialAttackEnergy(): number {
    this.specialAttackEnergy = this.specialAttack.increaseEnergy(
      this.specialAttackEnergy,
    );

    return this.specialAttackEnergy;
  }

  public resetSpecialAttackEnergy(): number {
    this.specialAttackEnergy = 0;

    return this.specialAttackEnergy;
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

  private dodge(attackerAccuracy: number): boolean {
    return this.dodgeBehavior.dodge(this.agility, attackerAccuracy);
  }
}
