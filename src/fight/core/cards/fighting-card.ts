import { AttackResult } from './@types/action-result/attack-result';
import { CardInfo } from './@types/card-info';
import { FightingContext } from './@types/fighting-context';
import { SpecialResult } from './@types/action-result/special-result';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { AttackSkill } from './skills/attack-skill';
import { Special } from './skills/special';
import { CardState } from './@types/state/card-state';
import { StateResult } from './@types/action-result/state-result';
import { CardStateFrozen } from './@types/state/card-state-frozen';
import { EffectLevel } from './@types/attack/effect-level';
import { Buff } from './@types/buff/buff';
import { Debuff } from './@types/buff/debuff';
import { Skill, SkillResults } from './skills/skill';
import { BuffType, DebuffType } from './@types/buff/type';
import { Element } from './@types/damage/element';

export class FightingCard {
  // Info
  public readonly id: string;
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
  private readonly element: Element;

  // Dynamic Stats
  private specialEnergy: number = 0;
  private receivedDamages: number = 0;
  private receivedHeal: number = 0;

  // Buffs
  private buffs: Buff[] = [];

  // Debuffs
  private debuffs: Debuff[] = [];

  // Skills
  private simpleAttack: AttackSkill;
  private special: Special;
  private skills: Skill[];

  // Behaviors
  private dodgeBehavior: DodgeBehavior;

  // Status
  private poisoned?: CardState;
  private burned?: CardState;
  private frozen?: CardState;

  constructor(
    id: string,
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
      simpleAttack: AttackSkill;
      special: Special;
      others: Skill[];
    },
    behaviors: {
      dodge: DodgeBehavior;
    },
    element: Element = Element.PHYSICAL,
  ) {
    this.id = id;
    this.name = name;
    this.attack = stats.attack;
    this.defense = stats.defense;
    this.maxHealth = stats.health;
    this.speed = stats.speed;
    this.agility = stats.agility;
    this.accuracy = stats.accuracy;
    this.criticalChance = stats.criticalChance;
    this.element = element;
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

  public get healthRatio(): number {
    return this.actualHealth / this.maxHealth;
  }

  public get actualSpeed(): number {
    return this.speed;
  }

  public get actualCriticalChance(): number {
    return this.criticalChance;
  }

  public get actualAccuracy(): number {
    const accuracyBuffs = this.buffs
      .filter((buff) => buff.type === 'accuracy')
      .reduce((sum, buff) => sum + buff.value, 0);
    const accuracyDebuffs = this.debuffs
      .filter((debuff) => debuff.type === 'accuracy')
      .reduce((sum, debuff) => sum + debuff.value, 0);
    return Math.max(0, this.accuracy + accuracyBuffs - accuracyDebuffs);
  }

  public get actualAttack(): number {
    const attackBuffs = this.buffs
      .filter((buff) => buff.type === 'attack')
      .reduce((sum, buff) => sum + buff.value, 0);
    const attackDebuffs = this.debuffs
      .filter((debuff) => debuff.type === 'attack')
      .reduce((sum, debuff) => sum + debuff.value, 0);
    return Math.max(0, this.attack + attackBuffs - attackDebuffs);
  }

  public get actualDefense(): number {
    const defenseBuffs = this.buffs
      .filter((buff) => buff.type === 'defense')
      .reduce((sum, buff) => sum + buff.value, 0);
    const defenseDebuffs = this.debuffs
      .filter((debuff) => debuff.type === 'defense')
      .reduce((sum, debuff) => sum + debuff.value, 0);
    return Math.max(0, this.defense + defenseBuffs - defenseDebuffs);
  }

  public get actualAgility(): number {
    const agilityBuffs = this.buffs
      .filter((buff) => buff.type === 'agility')
      .reduce((sum, buff) => sum + buff.value, 0);
    const agilityDebuffs = this.debuffs
      .filter((debuff) => debuff.type === 'agility')
      .reduce((sum, debuff) => sum + debuff.value, 0);
    return Math.max(0, this.agility + agilityBuffs - agilityDebuffs);
  }

  public get actualEnergy(): number {
    return this.specialEnergy;
  }

  public get identityInfo(): CardInfo {
    return {
      id: this.id,
      name: this.name,
      deckIdentity: this.cardDeckIdentity,
    };
  }

  public get cardElement(): Element {
    return this.element;
  }

  public get poisonLevel(): EffectLevel {
    return this.poisoned?.level ?? 0;
  }

  public get frozenLevel(): EffectLevel {
    return this.frozen?.level ?? 0;
  }

  public get isFrozen(): boolean {
    return !!this.frozen;
  }

  public get burnLevel(): EffectLevel {
    return this.burned?.level ?? 0;
  }

  public setOwnerInfo(ownerName: string, cardPositionInDeck: number): void {
    this.cardDeckIdentity = `${ownerName}-${cardPositionInDeck}`;
  }

  public setState(newState: CardState): void {
    if (this.isDead()) return;

    if (newState.type === 'poison') {
      this.poisoned = newState;
    }

    if (newState.type === 'burn') {
      this.burned = newState;
    }

    if (newState.type === 'freeze') {
      this.frozen = newState;
    }
  }

  public unFreeze(): void {
    this.frozen = undefined;
  }

  public unBurn(): void {
    this.burned = undefined;
  }

  public tickSkills(): void {
    this.skills.forEach((skill) => {
      if (skill.tick) skill.tick();
    });
  }

  public launchAttack(context: FightingContext): AttackResult[] {
    return this.simpleAttack.launch(this, context);
  }

  public launchSpecial(context: FightingContext): SpecialResult {
    return this.special.launch(this, context);
  }

  public launchSkill(
    trigger: string,
    context: FightingContext,
  ): SkillResults | null {
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

    this.frozen = this.frozen?.remainingTurns ? this.frozen : undefined;
    this.poisoned = this.poisoned?.remainingTurns ? this.poisoned : undefined;
    this.burned = this.burned?.remainingTurns ? this.burned : undefined;

    // remove undefined states results
    return stateResults.filter((result) => result !== undefined);
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

  public specialKind(): string {
    return this.special.getSpecialKind();
  }

  public collectsDamages(damage: number): number {
    let causedDamages = Math.max(0, damage - this.defense);
    if (this.frozen) {
      const frozenState = this.frozen as CardStateFrozen;
      causedDamages = frozenState.applyDamageRate(causedDamages);
    }
    this.receivedDamages += causedDamages;

    return causedDamages;
  }

  public applyFinalDamage(damage: number): number {
    let causedDamages = damage;
    if (this.frozen) {
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
    return this.dodgeBehavior.dodge(this.actualAgility, attackerAccuracy);
  }

  public applyBuff(
    buffType: BuffType,
    buffRate: number,
    duration: number,
    terminationEvent?: string,
  ): Buff {
    const value = this.computeAttributeModifierValue(buffType, buffRate);
    const buff: Buff = { type: buffType, value, duration, terminationEvent };

    if (terminationEvent) {
      const existingIndex = this.buffs.findIndex(
        (b) => b.type === buffType && b.terminationEvent === terminationEvent,
      );
      if (existingIndex >= 0) {
        this.buffs[existingIndex] = buff;
        return buff;
      }
    }

    this.buffs.push(buff);

    return buff;
  }

  public removeEventBoundBuffs(
    eventName: string,
  ): { type: BuffType; value: number }[] {
    const removed = this.buffs
      .filter((b) => b.terminationEvent === eventName)
      .map((b) => ({ type: b.type, value: b.value }));

    this.buffs = this.buffs.filter((b) => b.terminationEvent !== eventName);

    return removed;
  }

  public lifecycleEndEvents(): string[] {
    return this.skills
      .map((skill) => skill.lifecycleEndEvent?.())
      .filter((event): event is string => event !== undefined);
  }

  public decreaseBuffAndDebuffDuration(): void {
    this.buffs = this.buffs
      .map((buff) => ({ ...buff, duration: buff.duration - 1 }))
      .filter((buff) => buff.duration > 0);

    this.debuffs = this.debuffs
      .map((debuff) => ({ ...debuff, duration: debuff.duration - 1 }))
      .filter((debuff) => debuff.duration > 0);
  }

  public applyDebuff(
    debuffType: DebuffType,
    debuffRate: number,
    duration: number,
  ): Debuff {
    const debuff: Debuff = {
      type: debuffType,
      value: this.computeAttributeModifierValue(debuffType, debuffRate),
      duration: duration,
    };

    this.debuffs.push(debuff);

    return debuff;
  }

  private computeAttributeModifierValue(
    type: BuffType | DebuffType,
    rate: number,
  ): number {
    switch (type) {
      case 'attack':
        return rate * this.attack;
      case 'defense':
        return rate * this.defense;
      case 'agility':
        return rate * this.agility;
      case 'accuracy':
        return rate * this.accuracy;
    }
  }
}
