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
import { StateResult } from './@types/action-result/state-result';
import { CardStateFrozen } from './@types/state/card-state-frozen';

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

  // Status
  private poisoned?: CardState;
  private burned?: CardState;
  private frozen?: CardState;

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
    return [this.poisoned, this.burned, this.frozen]
      .filter(Boolean)
      .sort((a, b) => a.type.localeCompare(b.type));
  }

  public setOwnerInfo(ownerName: string, cardPositionInDeck: number): void {
    this.cardDeckIdentity = `${ownerName}-${cardPositionInDeck}`;
  }

  public setState(state: CardState): void {
    if (this.isDead()) return;

    if (state.type === 'poison') {
      this.poisoned = state;
    }

    if (state.type === 'burn') {
      this.burned = state;
    }

    if (state.type === 'freeze') {
      this.frozen = state;
    }
  }

  public removeState(state: CardState): void {
    if (state.type === 'poison') {
      this.poisoned = undefined;
    }

    if (state.type === 'burn') {
      this.burned = undefined;
    }

    if (state.type === 'freeze') {
      this.frozen = undefined;
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

  public applyStateEffects(): StateResult[] {
    if (this.isDead()) {
      return [];
    }

    const stateResults: StateResult[] = [];

    if (this.frozen) {
      stateResults.push(this.frozen.applyState(this));
    }

    if (this.poisoned) {
      stateResults.push(this.poisoned.applyState(this));
    }

    if (this.burned) {
      stateResults.push(this.burned.applyState(this));
    }

    return stateResults;
  }

  public fasterThan(defender: FightingCard | null): boolean {
    return !defender || this.speed > defender.speed;
  }

  public isDead(): boolean {
    return this.actualHealth <= 0;
  }

  public isPoisoned(): boolean {
    return !!this.poisoned;
  }

  public isBurned(): boolean {
    return !!this.burned;
  }

  public isFrozen(): boolean {
    return !!this.frozen;
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

  public specialKind(): string {
    return this.special.getSpecialKind();
  }

  public collectsDamages(damage: number): number {
    let causedDamages = Math.max(0, damage - this.defense);
    if (this.isFrozen()) {
      const frozenState = this.frozen as CardStateFrozen;
      causedDamages = frozenState.applyDamageRate(causedDamages);
    }
    this.receivedDamages += causedDamages;

    return causedDamages;
  }

  public addRealDamage(damage: number): number {
    this.receivedDamages += damage;

    return damage;
  }

  public heal(hpToRestore: number): number {
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
