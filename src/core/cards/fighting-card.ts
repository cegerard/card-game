import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from './@types/attack-result';
import { CardInfo } from './@types/card-info';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { SimpleAttack } from './skills/simple-attack';
import { SpecialAttack } from './skills/special-attack';

export class FightingCard {
  // Info
  public readonly name: string;
  private cardDeckIdentity: string = '';

  // Fixed Stats
  private readonly damage: number;
  private readonly defense: number;
  private readonly health: number;
  private readonly speed: number;
  private readonly agility: number;
  private readonly accuracy: number;
  private readonly criticalChance: number;

  // Dynamic Stats
  private specialEnergy: number = 0;
  private receivedDamages: number = 0;

  // Skills
  private simpleAttack: SimpleAttack;
  private special: SpecialAttack;

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
      special: SpecialAttack;
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
    this.special = skills.special;
    this.dodgeBehavior = behaviors.dodge;
  }

  public get actualHealth(): number {
    return Math.max(0, this.health - this.receivedDamages);
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

  public attack(defender: FightingCard): AttackResult {
    const isCritical = Math.random() < this.criticalChance;

    if (defender.dodge(this.accuracy)) {
      return { damage: 0, isCritical, dodge: true };
    }

    const computedDamage = this.simpleAttack.computeDamage(
      this.damage,
      isCritical,
    );
    const damage = defender.collectsDamages(computedDamage);

    return { damage, isCritical, dodge: false };
  }

  public launchSpecial(defender: FightingCard): AttackResult {
    const isCritical = Math.random() < this.criticalChance;

    if (defender.dodge(this.accuracy)) {
      return { damage: 0, isCritical, dodge: true };
    }

    const computedDamage = this.special.computeDamage(this.damage, isCritical);
    const damage = defender.collectsDamages(computedDamage);

    return { damage, isCritical, dodge: false };
  }

  public fasterThan(defender: FightingCard | null): boolean {
    return !defender || this.speed > defender.speed;
  }

  public isDead(): boolean {
    return this.actualHealth <= 0;
  }

  public isSpecialReady(): boolean {
    return this.special.ready(this.specialEnergy);
  }

  public increaseSpecialEnergy(): number {
    this.specialEnergy = this.special.increaseEnergy(this.specialEnergy);

    return this.specialEnergy;
  }

  public resetSpecialEnergy(): number {
    this.specialEnergy = 0;

    return this.specialEnergy;
  }

  public specialTargeting(): TargetingCardStrategy {
    return this.special.targetingStrategy;
  }

  public simpleAttackTargeting(): TargetingCardStrategy {
    return this.simpleAttack.targetingStrategy;
  }

  private collectsDamages(damage: number): number {
    const causedDamages = Math.max(0, damage - this.defense);
    this.receivedDamages += causedDamages;

    return causedDamages;
  }

  private dodge(attackerAccuracy: number): boolean {
    return this.dodgeBehavior.dodge(this.agility, attackerAccuracy);
  }
}
