import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from './@types/action-result/attack-result';
import { CardInfo } from './@types/card-info';
import { FightingContext } from './@types/fighting-context';
import { HealingResults } from './@types/action-result/healing-results';
import { SpecialResult } from './@types/action-result/special-result';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { SimpleAttack } from './skills/simple-attack';
import { Skill } from './skills/skill';
import { Special } from './skills/special';
import { CardState } from './@types/state/card-state';

export class FightingCard {
  // Info
  public readonly name: string;
  private cardDeckIdentity: string = '';

  // Fixed Stats
  private readonly attack: number;
  private readonly defense: number;
  private readonly maxHealth: number;
  private readonly speed: number;
  private readonly agility: number;
  private readonly accuracy: number;
  private readonly criticalChance: number;

  // Dynamic Stats
  private specialEnergy: number = 0;
  private receivedDamages: number = 0;
  private receivedHeal: number = 0;

  // Skills
  private simpleAttack: SimpleAttack;
  private special: Special;
  private skills: Skill[];

  // Behaviors
  private dodgeBehavior: DodgeBehavior;

  //Status
  private poisoned?: CardState;

  constructor(
    name: string,
    stats: {
      attack: number;
      defense: number;
      health: number;
      speed: number;
      agility: number;
      accuracy: number;
      criticalChance: number;
    },
    skills: {
      simpleAttack: SimpleAttack;
      special: Special;
      others: Skill[];
    },
    behaviors: {
      dodge: DodgeBehavior;
    },
  ) {
    this.name = name;
    this.attack = stats.attack;
    this.defense = stats.defense;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.agility = stats.agility;
    this.accuracy = stats.accuracy;
    this.criticalChance = stats.criticalChance;
    this.simpleAttack = skills.simpleAttack;
    this.special = skills.special;
    this.dodgeBehavior = behaviors.dodge;
    this.skills = skills.others;
  }

  public get actualHealth(): number {
    return Math.max(
      0,
      this.maxHealth - this.receivedDamages + this.receivedHeal,
    );
  }

  public get actualSpeed(): number {
    return this.speed;
  }

  public get actualCriticalChance(): number {
    return this.criticalChance;
  }

  public get actualAccuracy(): number {
    return this.accuracy;
  }

  public get actualAttack(): number {
    return this.attack;
  }

  public get actualEnergy(): number {
    return this.specialEnergy;
  }

  public get identityInfo(): CardInfo {
    return { name: this.name, deckIdentity: this.cardDeckIdentity };
  }

  public get states(): CardState[] {
    return this.poisoned ? [this.poisoned] : [];
  }

  public setOwnerInfo(ownerName: string, cardPositionInDeck: number): void {
    this.cardDeckIdentity = `${ownerName}-${cardPositionInDeck}`;
  }

  public setState(state: CardState): void {
    if (state.type === 'poison') {
      this.poisoned = state;
    }
  }

  public launchAttack(context: FightingContext): AttackResult[] {
    return this.simpleAttack.launch(this, context);
  }

  public launchSpecial(context: FightingContext): SpecialResult[] {
    return this.special.launch(this, context);
  }

  public launchSkill(
    trigger: string,
    context: FightingContext,
  ): HealingResults | null {
    const skill = this.skills.find((s) => s.isTriggered(trigger));

    if (!skill) return null;

    return skill.launch(this, context);
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
    return this.special.getTargetingStrategy();
  }

  public specialKind(): string {
    return this.special.getSpecialKind();
  }

  public collectsDamages(damage: number): number {
    if (this.isDead()) {
      return 0;
    }

    const causedDamages = Math.max(0, damage - this.defense);
    this.receivedDamages += causedDamages;

    return causedDamages;
  }

  public heal(hpToRestore: number): number {
    if (this.isDead()) {
      return 0;
    }

    let healed = hpToRestore;

    if (this.actualHealth + hpToRestore > this.maxHealth) {
      healed = this.maxHealth - this.actualHealth;
    }

    this.receivedHeal += healed;

    return healed;
  }

  public dodge(attackerAccuracy: number): boolean {
    return this.dodgeBehavior.dodge(this.agility, attackerAccuracy);
  }
}
