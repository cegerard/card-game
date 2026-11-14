import { CardInfo } from './@types/card-info';
import { FightingContext } from './@types/fighting-context';
import { SpecialResult } from './@types/action-result/special-result';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { AttackSkill } from './skills/attack-skill';
import { Special } from './skills/special';
import { CardState } from './@types/state/card-state';
import { StateEffectType } from './@types/state/state-effect-type';
import { StateResult } from './@types/action-result/state-result';
import { CardStateFrozen } from './@types/state/card-state-frozen';
import { CardStateStunted } from './@types/state/card-state-stunted';
import { CardStateBleeding } from './@types/state/card-state-bleeding';
import { CardStateStackedPoison } from './@types/state/card-state-stacked-poison';
import { DodgeBonusDenialSkill } from './skills/dodge-bonus-denial';
import { BleedStackScalingSkill } from './skills/bleed-stack-scaling';
import { PoisonedEnemyAgilitySkill } from './skills/poisoned-enemy-agility';
import { AttackerInsightSkill } from './skills/attacker-insight';
import { LowHealthTargetBonusSkill } from './skills/low-health-target-bonus';
import {
  BleedApplication,
  BleedEmpowermentSkill,
} from './skills/bleed-empowerment';
import { EffectLevel } from './@types/attack/effect-level';
import {
  AlterationDetail,
  Buff,
  Debuff,
  AlterationStacking,
} from './@types/alteration/alteration-detail';
import { Skill, SkillResults } from './skills/skill';
import { HealthReactiveSkill } from './skills/reactive-skill';
import { SurviveSkill } from './skills/survive';
import { DamageReductionSkill } from './skills/damage-reduction';
import { AlterationType } from './@types/alteration/alteration-type';
import { Element } from './@types/damage/element';
import { DamageType } from './@types/damage/damage-type';
import { ElementalMark } from './@types/mark/elemental-mark';
import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { NamedAttackResult } from './@types/action-result/named-attack-result';
import { round2 } from '../../tools/round';
import { Randomizer } from '../randomizer';
import { Shield } from './@types/shield/shield';
import { Stance, StanceActivation } from './@types/stance/stance';
import { Concealment } from './@types/concealment/concealment';
import {
  StatusCategory,
  statusCategoryOf,
} from './@types/state/status-category';
import {
  WEAK_POINT_ENDED_TYPE,
  WeakPoint,
  WeakPointEndReason,
} from './@types/weak-point/weak-point';
import { WeakPoints } from './@types/weak-point/weak-points';
import {
  DECOY_STRUCK_TYPE,
  DecoyStruckResult,
  EffectResult,
  SUPPORT_BLOCK_ENDED_TYPE,
} from './@types/attack/attack-effect';
import { LiveRate } from './@types/alteration/live-rate';
import {
  BattlefieldDeployment,
  BattlefieldExposure,
  DamageSharing,
} from './@types/battlefield/battlefield';
import { ElementalMatrix } from './damage/elemental-matrix';
import { CardStateEntangled } from './@types/state/card-state-entangled';
import {
  VULNERABILITY_ENDED_TYPE,
  Vulnerability,
} from './@types/vulnerability/vulnerability';

/**
 * Turns the resistance stat into a refusal chance. Chosen so the 20-80 design
 * range of the stat spans 10% to 40% of incoming statuses and debuffs refused.
 */
const RESISTANCE_REFUSAL_DIVISOR = 200;

/** What an alteration carries besides its rate and its lifetime. */
export type AlterationOptions = {
  live?: LiveRate;
  origin?: string;
  terminationDamageRate?: number;
};

export type FinalDamageResult = {
  damageToHealth: number;
  shieldAbsorbed: number;
  survived?: boolean;
  survivedSkillName?: string;
  mitigated?: boolean;
  mitigatedSkillName?: string;
  /** The part of the hit the other members of a damage sharing circle took. */
  damageShared?: SharedDamage;
};

export type SharedDamage = {
  name: string;
  shares: { card: FightingCard; damage: number }[];
};

/** What one battlefield did to the card at its turn end. */
export type BattlefieldTick = {
  name: string;
  source: FightingCard;
  healed?: number;
  damage?: number;
  damageType?: DamageType;
};

type Transformation = {
  name: string;
  remainingTurns: number;
  endCostRate?: number;
  criticalDamageRate?: number;
};

export type TransformationEnd = {
  name: string;
  healthCost: number;
};

type Lifesteal = {
  name: string;
  rate: number;
  remainingTurns: number;
};

type Protection = {
  ally: FightingCard;
  remainingTurns: number;
};

type MarkEntry = {
  mark: ElementalMark;
  stacks: number;
};

export type TargetingOverrideEntry = {
  strategy: TargetingCardStrategy;
  terminationEvent: string;
  powerId?: string;
};

export class FightingCard {
  // Info
  public readonly id: string;
  public readonly name: string;
  private cardDeckIdentity: string = '';

  // Fixed Stats
  private readonly attack: number;
  private readonly defense: number;
  public readonly maxHealth: number;
  private readonly speed: number;
  private readonly agility: number;
  private readonly accuracy: number;
  private readonly criticalChance: number;
  private readonly regeneration: number;
  private readonly resistance: number;
  private readonly element: Element;
  private readonly randomizer: Randomizer;

  // Dynamic Stats
  private specialEnergy: number = 0;
  private receivedDamages: number = 0;
  private receivedHeal: number = 0;
  private _lastAttacker?: FightingCard;

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

  // Shield
  private shield: Shield | null = null;

  // Elemental marks
  private marks: MarkEntry[] = [];

  // Lifesteal
  private lifesteal: Lifesteal | null = null;

  // Protection granted to one ally
  private protection: Protection | null = null;

  // Status immunity
  private statusImmunity: { remainingTurns: number } | null = null;

  // Transformation
  private transformation: Transformation | null = null;

  // Survive
  private surviveSkill: SurviveSkill | null = null;

  // Damage reduction
  private damageReduction: DamageReductionSkill | null = null;
  private dodgeBonusDenial: DodgeBonusDenialSkill | null = null;
  private bleedStackScaling: BleedStackScalingSkill | null = null;
  private lowHealthTargetBonus: LowHealthTargetBonusSkill | null = null;
  private bleedEmpowerment: BleedEmpowermentSkill | null = null;
  private poisonedEnemyAgility: PoisonedEnemyAgilitySkill | null = null;
  private attackerInsight: AttackerInsightSkill | null = null;
  private attacked = false;

  // Stances
  private stances: Stance[] = [];

  // Concealment
  private concealment: Concealment | null = null;

  // Battlefields the card stands in
  private exposures: BattlefieldExposure[] = [];

  // A one-shot bonus on the next attack
  private empowerment: { name: string; rate: number } | null = null;

  // Turns of its side since the card died, and how many times it came back
  private turnsDead = 0;
  private revivalCount = 0;

  private lastPreDamageHealthRatio = 1;

  // Health lost between the start of its previous action and this one
  private receivedDamagesAtActionStart = 0;
  private damagedBeforeAction = false;

  // Targeting overrides
  private targetingOverrides: TargetingOverrideEntry[] = [];

  // Status
  private poisoned?: CardState;
  private burned?: CardState;
  private frozen?: CardState;
  private stunted?: CardState;
  private bleeding?: CardStateBleeding;
  private hypothermic?: CardState;
  private entangled?: CardStateEntangled;
  private supportBlock: { remainingTurns: number } | null = null;
  private struckDecoy?: DecoyStruckResult;
  private vulnerabilities: Vulnerability[] = [];
  private readonly weakPoints = new WeakPoints();
  private laidBleedStacks = 0;
  private readonly poisonedCards = new Set<FightingCard>();

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
      regeneration?: number;
      resistance?: number;
    },
    skills: {
      simpleAttack: AttackSkill;
      special: Special;
      others: Skill[];
      survive?: SurviveSkill;
      damageReduction?: DamageReductionSkill;
      dodgeBonusDenial?: DodgeBonusDenialSkill;
      bleedStackScaling?: BleedStackScalingSkill;
      bleedEmpowerment?: BleedEmpowermentSkill;
      lowHealthTargetBonus?: LowHealthTargetBonusSkill;
      poisonedEnemyAgility?: PoisonedEnemyAgilitySkill;
      attackerInsight?: AttackerInsightSkill;
    },
    behaviors: {
      dodge: DodgeBehavior;
    },
    randomizer: Randomizer,
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
    this.regeneration = stats.regeneration ?? 0;
    this.resistance = stats.resistance ?? 0;
    this.element = element;
    this.randomizer = randomizer;
    this.simpleAttack = skills.simpleAttack;
    this.special = skills.special;
    this.dodgeBehavior = behaviors.dodge;
    this.skills = skills.others;
    this.surviveSkill = skills.survive ?? null;
    this.damageReduction = skills.damageReduction ?? null;
    this.dodgeBonusDenial = skills.dodgeBonusDenial ?? null;
    this.bleedStackScaling = skills.bleedStackScaling ?? null;
    this.bleedEmpowerment = skills.bleedEmpowerment ?? null;
    this.lowHealthTargetBonus = skills.lowHealthTargetBonus ?? null;
    this.poisonedEnemyAgility = skills.poisonedEnemyAgility ?? null;
    this.attackerInsight = skills.attackerInsight ?? null;
  }

  public get lastAttacker(): FightingCard | undefined {
    return this._lastAttacker;
  }

  public set lastAttacker(card: FightingCard) {
    this._lastAttacker = card;
  }

  /** The last card whose attack this card dodged. */
  public lastDodgedAttacker?: FightingCard;

  public get actualHealth(): number {
    return Math.max(
      0,
      this.maxHealth - this.receivedDamages + this.receivedHeal,
    );
  }

  public get healthRatio(): number {
    return this.actualHealth / this.maxHealth;
  }

  /**
   * The health ratio the card had just before the last damage it took — for a
   * dead card, how wounded it was when the fatal blow landed.
   */
  public get healthRatioBeforeLastDamage(): number {
    return this.lastPreDamageHealthRatio;
  }

  /**
   * Whether the card lost health — a shield or a dodge cost it none — between
   * the start of its previous action and the start of the current one.
   */
  public get damagedSinceLastAction(): boolean {
    return this.damagedBeforeAction;
  }

  public beginAction(): void {
    this.damagedBeforeAction =
      this.receivedDamages > this.receivedDamagesAtActionStart;
    this.receivedDamagesAtActionStart = this.receivedDamages;
  }

  public get actualSpeed(): number {
    return this.computeActualStat(this.speed, 'speed');
  }

  public get actualCriticalChance(): number {
    return Math.min(
      1,
      this.computeActualStat(this.criticalChance, 'criticalChance'),
    );
  }

  public get actualAccuracy(): number {
    return this.computeActualStat(this.accuracy, 'accuracy');
  }

  public get actualAttack(): number {
    return this.computeActualStat(this.attack, 'attack');
  }

  /**
   * The attack an action strikes with. An attack names its `defender`, which
   * the low health target bonus reads; a status effect names none.
   */
  public attackPower(
    context?: FightingContext,
    defender?: FightingCard,
  ): number {
    const stackBonus = this.bleedStackScaling?.multiplierFor(context) ?? 1;

    return this.actualAttack * stackBonus * this.targetBonusAgainst(defender);
  }

  /**
   * The bonus the low health target passive and the weak points this card
   * revealed on that defender grant against it.
   */
  public targetBonusAgainst(defender?: FightingCard): number {
    if (!defender) return 1;
    const lowHealthBonus =
      this.lowHealthTargetBonus?.multiplierAgainst(defender) ?? 1;

    return (
      lowHealthBonus *
      (1 + defender.weakPoints.bonusOf(this, 'attackRate')) *
      (1 + (this.empowerment?.rate ?? 0))
    );
  }

  /** The critical chance against that defender, its weak points included. */
  public criticalChanceAgainst(defender: FightingCard): number {
    return Math.min(
      1,
      this.actualCriticalChance + defender.weakPoints.criticalChanceBonus,
    );
  }

  /** What a critical hit multiplies `base` by, a transformation included. */
  public criticalMultiplier(base: number): number {
    return base * (1 + (this.transformation?.criticalDamageRate ?? 0));
  }

  /** The accuracy this card strikes that defender with, its weak points and insight included. */
  public accuracyAgainst(defender: FightingCard): number {
    const rate =
      defender.weakPoints.bonusOf(this, 'accuracyRate') +
      (this.attackerInsight?.accuracyRateAgainst(defender) ?? 0);

    return this.actualAccuracy + round2(this.accuracy * rate);
  }

  /** Whether the card already attacked somebody during the fight. */
  public get hasAttacked(): boolean {
    return this.attacked;
  }

  public recordAttack(): void {
    this.attacked = true;
  }

  public get actualDefense(): number {
    return this.computeActualStat(this.defense, 'defense');
  }

  /**
   * Agility after buffs and debuffs. The `POISONED_ENEMY_AGILITY` bonus is
   * added on top, outside the agility debuffs, as a bonus of the card own
   * kit rather than a buff it could lose.
   */
  public get actualAgility(): number {
    const poisonBonus = round2(
      this.agility *
        (this.poisonedEnemyAgility?.rateFor(this.poisonedCardCount) ?? 0),
    );

    return this.computeActualStat(this.agility, 'agility') + poisonBonus;
  }

  /** Health points the card restores to itself at each turn end. */
  public get actualRegeneration(): number {
    return this.computeActualStat(this.regeneration, 'regeneration');
  }

  public get actualResistance(): number {
    return this.computeActualStat(this.resistance, 'resistance');
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

  public poisonStacks(): number {
    return this.stackedPoison?.stacks ?? 0;
  }

  /** The card that laid the stacked poison this card carries, if any. */
  public get poisoner(): FightingCard | undefined {
    return this.stackedPoison?.source;
  }

  /** Raises a stacked poison to `stacks` and multiplies its damage; false without one. */
  public surgePoison(stacks: number, damageMultiplier: number): boolean {
    if (!this.stackedPoison) return false;

    this.stackedPoison.surge(stacks, damageMultiplier);
    return true;
  }

  public recordPoisonedCard(card: FightingCard): void {
    this.poisonedCards.add(card);
  }

  /** Living cards still carrying a stacked poison this card laid. */
  public get poisonedCardCount(): number {
    return [...this.poisonedCards].filter(
      (card) => !card.isDead() && card.poisoner === this,
    ).length;
  }

  private get stackedPoison(): CardStateStackedPoison | undefined {
    return this.poisoned instanceof CardStateStackedPoison
      ? this.poisoned
      : undefined;
  }

  public get frozenLevel(): EffectLevel {
    return this.frozen?.level ?? 0;
  }

  public get isFrozen(): boolean {
    return !!this.frozen;
  }

  public get isStunted(): boolean {
    return !!this.stunted;
  }

  public get burnLevel(): EffectLevel {
    return this.burned?.level ?? 0;
  }

  public bleedStacks(): number {
    return this.bleeding?.stackCount ?? 0;
  }

  /** Removes every bleed stack and tells how many there were. */
  public consumeBleedStacks(): number {
    const stacks = this.bleedStacks();
    this.bleeding = undefined;

    return stacks;
  }

  /** Bleed stacks this card has laid on others since the fight began. */
  public get bleedStacksApplied(): number {
    return this.laidBleedStacks;
  }

  public recordBleedStacksApplied(stacks: number): void {
    this.laidBleedStacks += stacks;
  }

  /** The stacks and rate a bleed this card applies actually carries. */
  public empowerBleed(application: BleedApplication): BleedApplication {
    return this.bleedEmpowerment?.empower(this, application) ?? application;
  }

  public get shielded(): boolean {
    return this.shield !== null;
  }

  public setOwnerInfo(ownerName: string, cardPositionInDeck: number): void {
    this.cardDeckIdentity = `${ownerName}-${cardPositionInDeck}`;
  }

  /**
   * Applies a status state on the card. Returns false when the card refuses
   * it, because it is dead, because it is immune to that status category
   * (unless `ignoresImmunity`), or because its resistance won the roll.
   */
  public setState(
    newState: CardState,
    { ignoresImmunity = false }: { ignoresImmunity?: boolean } = {},
  ): boolean {
    if (this.isDead()) return false;
    if (!ignoresImmunity && this.isImmuneTo(statusCategoryOf(newState.type)))
      return false;

    if (this.resists()) return false;

    if (newState instanceof CardStateStackedPoison) {
      newState.carryOver(this.poisoned);
    }

    if (newState.type === 'poison') {
      this.poisoned = newState;
    }

    if (newState.type === 'burn') {
      this.burned = newState;
    }

    if (newState.type === 'freeze') {
      this.frozen = newState;
    }

    if (newState.type === 'stunt') {
      this.stunted = newState;
    }

    if (newState.type === 'hypothermia') {
      this.hypothermic = newState;
    }

    if (newState instanceof CardStateEntangled) {
      this.entangled = newState;
    }

    if (newState instanceof CardStateBleeding) {
      if (this.bleeding) this.bleeding.addStacks(newState);
      else this.bleeding = newState;
    }

    return true;
  }

  /** Removes one status the card suffers, picked at random; returns its type. */
  public cleanseRandomStatus(): StateEffectType | undefined {
    const statuses = [
      this.poisoned,
      this.burned,
      this.frozen,
      this.stunted,
      this.bleeding,
      this.hypothermic,
      this.entangled,
    ].filter((state) => state !== undefined);
    if (statuses.length === 0) return undefined;

    const { type } =
      statuses[Math.floor(this.randomizer.random() * statuses.length)];
    if (type === 'poison') this.poisoned = undefined;
    if (type === 'burn') this.burned = undefined;
    if (type === 'freeze') this.frozen = undefined;
    if (type === 'stunt') this.stunted = undefined;
    if (type === 'bleed') this.bleeding = undefined;
    if (type === 'hypothermia') this.hypothermic = undefined;
    if (type === 'entangle') this.entangled = undefined;

    return type;
  }

  public get isEntangled(): boolean {
    return this.entangled !== undefined;
  }

  /**
   * Called when the card is about to act offensively: an entanglement goes
   * with that action, which fails on its chance. Returns whether it failed.
   */
  public failsOffensiveAction(): boolean {
    if (!this.entangled) return false;

    const { failChance } = this.entangled;
    this.entangled = undefined;
    return this.randomizer.random() < failChance;
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

  public getHealthReactiveSkills(): HealthReactiveSkill[] {
    return this.skills.filter(
      (s): s is HealthReactiveSkill =>
        (s as HealthReactiveSkill).isHealthReactive === true,
    );
  }

  public get attackTargetingId(): string {
    if (this.targetingOverrides.length > 0) {
      return this.targetingOverrides[this.targetingOverrides.length - 1]
        .strategy.id;
    }
    return this.simpleAttack.targetingId;
  }

  private get currentTargetingOverride(): TargetingCardStrategy | undefined {
    if (this.targetingOverrides.length === 0) return;

    return this.targetingOverrides[this.targetingOverrides.length - 1].strategy;
  }

  public overrideAttackTargeting(
    strategy: TargetingCardStrategy,
    terminationEvent: string,
    powerId?: string,
  ): void {
    this.targetingOverrides.push({ strategy, terminationEvent, powerId });
  }

  public restoreAttackTargeting(eventName: string): TargetingOverrideEntry[] {
    const removed = this.targetingOverrides.filter(
      (o) => o.terminationEvent === eventName,
    );
    this.targetingOverrides = this.targetingOverrides.filter(
      (o) => o.terminationEvent !== eventName,
    );
    return removed;
  }

  public launchAttack(context: FightingContext): NamedAttackResult {
    return this.simpleAttack.launch(
      this,
      context,
      this.currentTargetingOverride,
    );
  }

  public launchSpecial(context: FightingContext): SpecialResult {
    return this.special.launch(this, context, this.currentTargetingOverride);
  }

  /** Casts the attack special once more, the gauge untouched. */
  public echoSpecial(context: FightingContext): SpecialResult {
    if (this.specialKind() !== 'specialAttack') {
      throw new Error(
        `Only an attack special can be echoed, ${this.name} has ${this.specialKind()}`,
      );
    }

    return this.special.launch(this, context);
  }

  public launchSkills(
    trigger: string,
    context: FightingContext,
  ): SkillResults[] {
    this.skills.forEach((s) => s.activate?.(trigger, context));
    // A skill bound to a stance stays silent outside it: gating here rather
    // than in isTriggered() keeps the trigger about events only, and emits no
    // empty step for a skill that did not run.
    return this.skills
      .filter(
        (s) =>
          s.isTriggered(trigger) &&
          (!s.requiredStance || this.hasStance(s.requiredStance)) &&
          (!s.requiresUndamaged || !this.damagedSinceLastAction),
      )
      .map((skill) =>
        skill.launch(this, context, this.currentTargetingOverride),
      );
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

    if (this.stunted && !this.frozen) {
      stateResults.push(this.stunted.applyState(this));
    }

    if (this.bleeding) {
      stateResults.push(this.bleeding.applyState(this));
    }

    if (this.hypothermic) {
      stateResults.push(this.hypothermic.applyState(this));
    }

    this.frozen = this.frozen?.remainingTurns ? this.frozen : undefined;
    // A dead card keeps its poison whatever its remaining turns: the death
    // cascade reads who laid it, and that must not depend on who killed it.
    this.poisoned =
      this.poisoned?.remainingTurns || this.isDead()
        ? this.poisoned
        : undefined;
    this.burned = this.burned?.remainingTurns ? this.burned : undefined;
    this.stunted = this.stunted?.remainingTurns ? this.stunted : undefined;
    this.bleeding = this.bleeding?.stackCount ? this.bleeding : undefined;
    this.hypothermic = this.hypothermic?.remainingTurns
      ? this.hypothermic
      : undefined;

    return stateResults.filter((result) => result !== undefined);
  }

  public fasterThan(defender: FightingCard | null): boolean {
    return !defender || this.actualSpeed > defender.actualSpeed;
  }

  public isDead(): boolean {
    return this.actualHealth <= 0;
  }

  public isSpecialReady(): boolean {
    return this.special.ready(this.specialEnergy, this.energySurcharge);
  }

  public increaseSpecialEnergy(): number {
    this.specialEnergy = this.special.increaseEnergy(
      this.specialEnergy,
      undefined,
      this.energySurcharge,
    );

    return this.specialEnergy;
  }

  /** Energy granted by a skill, outside the turn gain; returns the new gauge. */
  public gainEnergy(amount: number): number {
    this.specialEnergy = this.special.increaseEnergy(
      this.specialEnergy,
      amount,
      this.energySurcharge,
    );

    return this.specialEnergy;
  }

  /** Extra energy its special costs, laid by the enemy battlefields it stands in. */
  private get energySurcharge(): number {
    return this.exposures.reduce(
      (sum, exposure) => sum + (exposure.energySurcharge ?? 0),
      0,
    );
  }

  public spendEnergy(amount: number): void {
    this.specialEnergy -= amount;
  }

  /** Energy an enemy takes away, never below 0; returns what was drained. */
  public drainEnergy(amount: number): number {
    const drained = Math.min(amount, this.specialEnergy);
    this.specialEnergy -= drained;

    return drained;
  }

  public resetSpecialEnergy(refund: number = 0): number {
    this.specialEnergy = refund;

    return this.specialEnergy;
  }

  public specialKind(): string {
    return this.special.getSpecialKind();
  }

  /**
   * Resolves the damage of one hit against the card defensive layers, in
   * order: state amplifiers (freeze, stunt), damage reduction, shield buffer,
   * then the health pool. Reducing before the shield absorbs makes the shield
   * last longer, which is the point of stacking both.
   *
   * Status effect ticks go through `addRealDamage()` and bypass all of this,
   * exactly as they bypass the shield.
   */
  public applyFinalDamage(damage: number): FinalDamageResult {
    this.recordHealthRatioBeforeDamage();
    let causedDamages = damage;
    if (this.frozen) {
      causedDamages = (this.frozen as CardStateFrozen).applyDamageRate(
        causedDamages,
      );
    }
    if (this.stunted) {
      causedDamages = (this.stunted as CardStateStunted).applyDamageRate(
        causedDamages,
      );
    }

    const mitigatedDamages = this.damageReduction?.tryMitigate(causedDamages);
    const mitigated = mitigatedDamages !== undefined;
    if (mitigated) {
      causedDamages = mitigatedDamages;
    }
    const mitigationReport = mitigated
      ? { mitigated: true, mitigatedSkillName: this.damageReduction.name }
      : {};

    const damageShared = this.shareDamage(causedDamages);
    if (damageShared) {
      causedDamages -= causedDamages * this.sharing.rate;
    }
    const sharingReport = damageShared ? { damageShared } : {};

    const shieldAbsorbed = this.absorbWithShield(causedDamages);
    let damageToHealth = causedDamages - shieldAbsorbed;
    damageToHealth = Math.min(damageToHealth, this.actualHealth);

    if (
      this.actualHealth - damageToHealth <= 0 &&
      this.surviveSkill?.tryConsume()
    ) {
      damageToHealth = this.actualHealth - 1;
      this.receivedDamages += damageToHealth;
      return {
        damageToHealth,
        shieldAbsorbed,
        survived: true,
        survivedSkillName: this.surviveSkill.name,
        ...mitigationReport,
        ...sharingReport,
      };
    }

    this.receivedDamages += damageToHealth;
    return {
      damageToHealth,
      shieldAbsorbed,
      ...mitigationReport,
      ...sharingReport,
    };
  }

  private get sharing(): DamageSharing | undefined {
    return this.exposures.find((exposure) => exposure.sharing)?.sharing;
  }

  /**
   * Hands a share of the hit to the other living members of the circle, each
   * taking at most `maxShareRate` of it. Without a partner to carry it, the
   * card keeps the whole hit.
   */
  private shareDamage(damage: number): SharedDamage | undefined {
    const sharing = this.sharing;
    if (!sharing || damage <= 0) return undefined;

    const partners = sharing.circle.filter(
      (card) => card !== this && !card.isDead() && card.sharing === sharing,
    );
    if (partners.length === 0) return undefined;

    const share = Math.min(
      (damage * sharing.rate) / partners.length,
      damage * sharing.maxShareRate,
    );
    return {
      name: sharing.name,
      shares: partners.map((card) => ({
        card,
        damage: card.takeSharedDamage(round2(share)),
      })),
    };
  }

  /** Damage carried for a circle partner: real, and never fatal. */
  private takeSharedDamage(damage: number): number {
    return this.addRealDamage(
      Math.max(0, Math.min(damage, this.actualHealth - 1)),
    );
  }

  /** Stands the card in a battlefield, or refreshes the one of that name. */
  public expose(exposure: BattlefieldExposure): void {
    this.exposures = [
      ...this.exposures.filter(
        (e) => e.deployment.name !== exposure.deployment.name,
      ),
      exposure,
    ];
  }

  public isExposedTo(deployment: BattlefieldDeployment): boolean {
    return this.exposures.some((e) => e.deployment === deployment);
  }

  /** What the battlefields the card stands in heal or deal at its turn end. */
  public tickBattlefields(): BattlefieldTick[] {
    if (this.isDead()) return [];

    return this.exposures.flatMap((exposure): BattlefieldTick[] => {
      const { name, source } = exposure.deployment;
      if (exposure.healRate) {
        if (this.refusesSupportFrom(source)) return [];
        const healed = this.healShareOfMaxHealth(exposure.healRate);
        return healed > 0 ? [{ name, source, healed }] : [];
      }
      if (exposure.damage && !this.isDead()) {
        const { amount, damageType } = exposure.damage;
        const damage = this.addRealDamage(
          round2(
            amount * ElementalMatrix.getMultiplier(damageType, this.element),
          ),
        );
        return [{ name, source, damage, damageType }];
      }
      return [];
    });
  }

  /** Decrements every battlefield on the card and returns the ones that just ended. */
  public decreaseBattlefieldDurations(): string[] {
    this.exposures.forEach((exposure) => exposure.remainingTurns--);
    const ended = this.exposures.filter((e) => e.remainingTurns < 0);
    this.exposures = this.exposures.filter((e) => e.remainingTurns >= 0);

    return ended.map((e) => e.deployment.name);
  }

  /** Makes a battlefield, and the alterations it laid, last `turns` more. */
  public extendBattlefield(
    deployment: BattlefieldDeployment,
    turns: number,
  ): void {
    this.exposures
      .filter((e) => e.deployment === deployment)
      .forEach((e) => (e.remainingTurns += turns));
    [...this.buffs, ...this.debuffs]
      .filter((a) => a.origin === deployment.name)
      .forEach((a) => (a.duration += turns));
  }

  /** A battlefield laid again refreshes its alterations rather than stacking them. */
  public removeAlterationsFrom(origin: string): void {
    this.buffs = this.buffs.filter((b) => b.origin !== origin);
    this.debuffs = this.debuffs.filter((d) => d.origin !== origin);
  }

  /** Whether the card stands in a battlefield of that element. */
  public standsInBattlefieldOf(element: Element): boolean {
    return this.exposures.some((e) => e.deployment.config.element === element);
  }

  /** Every battlefield deployment the card stands in. */
  public get battlefieldDeployments(): BattlefieldDeployment[] {
    return this.exposures.map((e) => e.deployment);
  }

  /** Multiplies the damage of the next attack by `1 + rate`, once. */
  public empower(name: string, rate: number): void {
    this.empowerment = { name, rate };
  }

  public get isEmpowered(): boolean {
    return this.empowerment !== null;
  }

  public consumeEmpowerment(): void {
    this.empowerment = null;
  }

  /** Turns its side played since the card died. */
  public get turnsSinceDeath(): number {
    return this.turnsDead;
  }

  public countTurnDead(): void {
    if (this.isDead()) this.turnsDead++;
  }

  /** Times the card came back from death, which makes each death a new one. */
  public get revivals(): number {
    return this.revivalCount;
  }

  /**
   * Brings a dead card back with `rate` of its max health, clear of what it
   * carried when it fell.
   */
  public revive(rate: number): void {
    this.receivedHeal = 0;
    this.receivedDamages = this.maxHealth - Math.round(rate * this.maxHealth);
    this.receivedDamagesAtActionStart = this.receivedDamages;
    this.poisoned = undefined;
    this.burned = undefined;
    this.frozen = undefined;
    this.stunted = undefined;
    this.bleeding = undefined;
    this.hypothermic = undefined;
    this.entangled = undefined;
    this.vulnerabilities = [];
    this.supportBlock = null;
    this.buffs = [];
    this.debuffs = [];
    this.shield = null;
    this.stances = [];
    this.concealment = null;
    this.protection = null;
    this.transformation = null;
    this.lifesteal = null;
    this.statusImmunity = null;
    this.exposures = [];
    this.empowerment = null;
    this.turnsDead = 0;
    this.revivalCount++;
  }

  /**
   * Heals a fraction of max health on every landed attack, for a number of
   * turns. Turn counting follows the buff convention: the duration is
   * decremented at each turn end and the lifesteal is dropped once it goes
   * below zero.
   */
  /**
   * Makes the card refuse every status effect for a number of turns. Turn
   * counting follows the buff convention.
   */
  public applyStatusImmunity(duration: number): void {
    this.statusImmunity = { remainingTurns: duration };
  }

  /**
   * Whether the card refuses the statuses of that category right now, either
   * through a blanket immunity (a transformation) or through a stance granting
   * it for that category only.
   */
  public isImmuneTo(category: StatusCategory): boolean {
    return (
      this.isStatusImmune ||
      this.stances.some((stance) => stance.immunities?.includes(category))
    );
  }

  public get isStatusImmune(): boolean {
    return this.statusImmunity !== null;
  }

  public decreaseStatusImmunityDuration(): void {
    if (!this.statusImmunity) return;

    const remainingTurns = this.statusImmunity.remainingTurns - 1;
    this.statusImmunity = remainingTurns < 0 ? null : { remainingTurns };
  }

  /**
   * Turns on a transformation for a number of turns. Turn counting follows
   * the buff convention, decremented by the turn manager.
   */
  public startTransformation(
    name: string,
    duration: number,
    endCostRate?: number,
    criticalDamageRate?: number,
  ): void {
    this.transformation = {
      name,
      remainingTurns: duration,
      endCostRate,
      criticalDamageRate,
    };
  }

  public get isTransformed(): boolean {
    return this.transformation !== null;
  }

  /**
  /**
   * Decrements the running transformation and returns it on the turn it ends,
   * after charging its health cost, so callers can report both. Returns null
   * otherwise. The cost never kills its owner: it leaves at least one health
   * point.
   */
  public decreaseTransformationDuration(): TransformationEnd | null {
    if (!this.transformation) return null;

    const remainingTurns = this.transformation.remainingTurns - 1;
    if (remainingTurns < 0) {
      const { name, endCostRate } = this.transformation;
      this.transformation = null;
      return { name, healthCost: this.payTransformationCost(endCostRate) };
    }

    this.transformation = { ...this.transformation, remainingTurns };
    return null;
  }

  private payTransformationCost(rate?: number): number {
    if (!rate) return 0;

    const cost = Math.min(
      Math.round(rate * this.maxHealth),
      this.actualHealth - 1,
    );

    return cost > 0 ? this.addRealDamage(cost) : 0;
  }

  /**
   * Steps in front of an ally for a number of turns: while it runs, attacks
   * aimed at that ally are resolved against this card instead, with its own
   * dodge, defence and element. Turn counting follows the buff convention, so
   * the protection lasts as many of the protector's turns as the power that
   * granted it. Re-protecting refreshes rather than stacks.
   */
  public protect(ally: FightingCard, duration: number): void {
    this.protection = { ally, remainingTurns: duration };
  }

  /** A dead guardian protects nobody. */
  public isProtecting(card: FightingCard): boolean {
    return this.protection?.ally === card && !this.isDead();
  }

  public get protectedAlly(): FightingCard | undefined {
    return this.protection?.ally;
  }

  /** Decrements the protection and returns the ally it just freed, if any. */
  public decreaseProtectionDuration(): FightingCard | null {
    if (!this.protection) return null;

    const remainingTurns = this.protection.remainingTurns - 1;
    if (remainingTurns < 0) {
      const { ally } = this.protection;
      this.protection = null;
      return ally;
    }

    this.protection = { ...this.protection, remainingTurns };
    return null;
  }

  public applyLifesteal(name: string, rate: number, duration: number): void {
    this.lifesteal = { name, rate, remainingTurns: duration };
  }

  public get lifestealName(): string | undefined {
    return this.lifesteal?.name;
  }

  public get hasLifesteal(): boolean {
    return this.lifesteal !== null;
  }

  public stealLife(): number {
    if (!this.lifesteal) return 0;

    return this.heal(this.lifesteal.rate * this.maxHealth);
  }

  public decreaseLifestealDuration(): void {
    if (!this.lifesteal) return;

    const remainingTurns = this.lifesteal.remainingTurns - 1;
    this.lifesteal =
      remainingTurns < 0 ? null : { ...this.lifesteal, remainingTurns };
  }

  /**
   * Opens a stance on the card, or refreshes the duration of one already
   * running: re-casting the power that grants it must not double its length,
   * and what the stance grants is kept unless the refresh states it again.
   */
  public activateStance({
    name,
    duration,
    immunities,
    revealsConcealed,
    evasionChance,
  }: StanceActivation): Stance {
    const running = this.stances.find((s) => s.name === name);
    if (running) {
      running.remainingTurns = duration;
      running.immunities = immunities ?? running.immunities;
      running.revealsConcealed = revealsConcealed ?? running.revealsConcealed;
      running.evasionChance = evasionChance ?? running.evasionChance;
      return running;
    }

    const stance: Stance = {
      name,
      remainingTurns: duration,
      immunities,
      revealsConcealed,
      evasionChance,
    };
    this.stances.push(stance);
    return stance;
  }

  /** Whether a running stance lets the card see concealed enemies. */
  public seesConcealed(): boolean {
    return this.stances.some((stance) => stance.revealsConcealed);
  }

  /**
   * Hides the card from every enemy targeting strategy, or refreshes a
   * running concealment. Without a duration it lasts until the card attacks.
   */
  public conceal(name: string, duration?: number): Concealment {
    this.concealment = { name, remainingTurns: duration };
    return this.concealment;
  }

  public isConcealed(): boolean {
    return this.concealment !== null;
  }

  /**
   * Whether an enemy can pick the card as a target: alive, and either visible
   * or facing an attacker whose stance reveals concealed cards.
   */
  public isTargetableBy(attacker: FightingCard): boolean {
    return !this.isDead() && (!this.isConcealed() || attacker.seesConcealed());
  }

  /** Ends the concealment when the card attacks; returns the one it broke. */
  public breakConcealment(): Concealment | null {
    const broken = this.concealment;
    this.concealment = null;
    return broken;
  }

  /**
   * Decrements a timed concealment and returns it when it just ran out, with
   * the same clock as a stance.
   */
  public decreaseConcealmentDuration(): Concealment | null {
    if (this.concealment?.remainingTurns === undefined) return null;

    this.concealment.remainingTurns--;
    if (this.concealment.remainingTurns >= 0) return null;

    return this.breakConcealment();
  }

  public hasStance(name: string): boolean {
    return this.stances.some((s) => s.name === name);
  }

  /** Closes a running stance before its time; returns whether it was held. */
  public endStance(name: string): boolean {
    const held = this.hasStance(name);
    this.stances = this.stances.filter((s) => s.name !== name);
    return held;
  }

  /** Decrements every running stance and returns the ones that just ended. */
  public decreaseStanceDurations(): string[] {
    const decremented = this.stances.map((s) => ({
      ...s,
      remainingTurns: s.remainingTurns - 1,
    }));
    const ended = decremented.filter((s) => s.remainingTurns < 0);
    this.stances = decremented.filter((s) => s.remainingTurns >= 0);

    return ended.map((s) => s.name);
  }

  public applyShield(rate: number, duration: number): Shield {
    return this.applyShieldPoints(Math.round(rate * this.maxHealth), duration);
  }

  /** A shield sized by somebody else than its bearer, such as its caster. */
  public applyShieldPoints(points: number, duration: number): Shield {
    this.shield = { points, duration };
    return this.shield;
  }

  public decreaseShieldDuration(): Shield | null {
    if (!this.shield) return null;

    this.shield = { ...this.shield, duration: this.shield.duration - 1 };
    if (this.shield.duration < 0) {
      const expired = this.shield;
      this.shield = null;
      return expired;
    }
    return null;
  }

  private absorbWithShield(damage: number): number {
    if (!this.shield) return 0;

    const absorbed = Math.min(this.shield.points, damage);
    this.shield = { ...this.shield, points: this.shield.points - absorbed };
    if (this.shield.points <= 0) {
      this.shield = null;
    }
    return absorbed;
  }

  public applyMark(mark: ElementalMark, stacks: number = 1): number {
    const entry = this.findMark(mark.damageType);
    if (!entry) {
      const appliedStacks = Math.min(stacks, mark.maxStacks);
      this.marks.push({ mark, stacks: appliedStacks });
      return appliedStacks;
    }

    entry.stacks = Math.min(entry.stacks + stacks, entry.mark.maxStacks);
    return entry.stacks;
  }

  public markStacks(damageType: DamageType): number {
    return this.findMark(damageType)?.stacks ?? 0;
  }

  public markAmplifier(damageType: DamageType): number {
    const entry = this.findMark(damageType);
    if (!entry) return 1;

    return 1 + entry.stacks * entry.mark.ratePerStack;
  }

  /**
   * Cuts the card off its allies support for a while: their heals and buffs
   * no longer reach it. Like a debuff, a dead card takes none and resistance
   * refuses it; a new one refreshes the running one.
   */
  public blockSupport(duration: number): boolean {
    if (this.isDead() || this.resists()) return false;

    this.supportBlock = { remainingTurns: duration };
    return true;
  }

  /** Whether a heal or a buff cast by `source` is refused: its own still land. */
  public refusesSupportFrom(source: FightingCard): boolean {
    return this.supportBlock !== null && source !== this;
  }

  /** Same clock as a weak point; reports the block when it runs out. */
  public decreaseSupportBlockDuration(): EffectResult[] {
    if (!this.supportBlock) return [];

    this.supportBlock.remainingTurns--;
    if (this.supportBlock.remainingTurns >= 0) return [];

    this.supportBlock = null;
    return [{ type: SUPPORT_BLOCK_ENDED_TYPE, card: this }];
  }

  /**
   * Makes the card weak to one damage type for a while, replacing the one of
   * that type. Like a debuff, a dead card takes none and resistance refuses it.
   */
  public applyVulnerability(
    damageType: DamageType,
    rate: number,
    duration: number,
  ): Vulnerability | undefined {
    if (this.isDead() || this.resists()) return undefined;

    const vulnerability = { damageType, rate, remainingTurns: duration };
    this.vulnerabilities = [
      ...this.vulnerabilities.filter((v) => v.damageType !== damageType),
      vulnerability,
    ];
    return vulnerability;
  }

  public vulnerabilityAmplifier(damageType: DamageType): number {
    const vulnerability = this.vulnerabilities.find(
      (v) => v.damageType === damageType,
    );

    return 1 + (vulnerability?.rate ?? 0);
  }

  /** Same clock as a weak point; reports the vulnerabilities that ran out. */
  public decreaseVulnerabilityDurations(): EffectResult[] {
    this.vulnerabilities.forEach((v) => v.remainingTurns--);
    const ended = this.vulnerabilities.filter((v) => v.remainingTurns < 0);
    this.vulnerabilities = this.vulnerabilities.filter(
      (v) => v.remainingTurns >= 0,
    );

    return ended.map((v) => ({
      type: VULNERABILITY_ENDED_TYPE,
      card: this,
      damageType: v.damageType,
    }));
  }

  /** Reveals a weak point on the card; a dead card reveals nothing. */
  public revealWeakPoint(weakPoint: WeakPoint): WeakPoint | undefined {
    if (this.isDead()) return undefined;

    this.weakPoints.reveal(weakPoint);
    return weakPoint;
  }

  public hasWeakPoint(): boolean {
    return !this.weakPoints.isEmpty;
  }

  /** The damage of a hit from that attacker, amplified by the card weak points. */
  public exposedDamage(damage: number, attacker: FightingCard): number {
    return Math.round(damage * this.weakPoints.damageMultiplierFor(attacker));
  }

  /**
   * An attack aimed at the card uses up its consumable weak points, landed or
   * dodged. A landed one lays its exploit effect, credited to its revealer.
   */
  public strikeWeakPoints(
    context: FightingContext,
    landed: boolean,
  ): EffectResult[] {
    return this.weakPoints.consume().flatMap((weakPoint) => {
      const ended = this.weakPointEnded(
        weakPoint,
        landed ? 'struck' : 'dodged',
      );
      const exploit =
        landed && !this.isDead()
          ? weakPoint.exploitEffect?.applyEffect(
              this,
              weakPoint.revealer,
              context,
            )
          : undefined;

      return exploit ? [ended, exploit] : [ended];
    });
  }

  /** Ticks the timed weak points and reports the ones that ran out. */
  public decreaseWeakPointDurations(): EffectResult[] {
    return this.weakPoints
      .tick()
      .map((weakPoint) => this.weakPointEnded(weakPoint, 'expired'));
  }

  /** Makes every weak point that revealer laid here permanent and amplified. */
  public persistWeakPointsOf(
    revealer: FightingCard,
    damageRate: number,
  ): WeakPoint[] {
    const persisted = this.weakPoints.revealedBy(revealer);
    persisted.forEach((weakPoint) => weakPoint.persist(damageRate));

    return persisted;
  }

  private weakPointEnded(
    weakPoint: WeakPoint,
    reason: WeakPointEndReason,
  ): EffectResult {
    return {
      type: WEAK_POINT_ENDED_TYPE,
      card: this,
      name: weakPoint.name,
      reason,
    };
  }

  private findMark(damageType: DamageType): MarkEntry | undefined {
    return this.marks.find((entry) => entry.mark.damageType === damageType);
  }

  // Frozen at the fatal blow: later hits on the corpse must not rewrite it.
  private recordHealthRatioBeforeDamage() {
    if (!this.isDead()) {
      this.lastPreDamageHealthRatio = this.healthRatio;
    }
  }

  /**
   * Takes every remaining health point as real damage, shield and damage
   * reduction ignored. A fatal blow like any other: an unconsumed SURVIVE
   * leaves the card at 1 HP instead.
   */
  public execute(): { survived?: boolean; survivedSkillName?: string } {
    if (this.surviveSkill?.tryConsume()) {
      this.addRealDamage(this.actualHealth - 1);
      return { survived: true, survivedSkillName: this.surviveSkill.name };
    }

    this.addRealDamage(this.actualHealth);
    return {};
  }

  public addRealDamage(damage: number): number {
    this.recordHealthRatioBeforeDamage();
    this.receivedDamages += damage;

    return damage;
  }

  /**
   * Heals a share of the card own maximum health, the way the shield and the
   * lifesteal buffers already size themselves. Keeping the computation here
   * means callers never need the maximum health itself.
   */
  public healShareOfMaxHealth(rate: number): number {
    return this.heal(rate * this.maxHealth);
  }

  public heal(hpToRestore: number): number {
    const roundedHpToRestore = round2(hpToRestore);
    let healed = roundedHpToRestore;

    if (this.actualHealth + roundedHpToRestore > this.maxHealth) {
      healed = this.maxHealth - this.actualHealth;
    }

    this.receivedHeal += healed;

    return healed;
  }

  /**
   * Whether the attack misses the card: a decoy of its side takes it, a
   * stance evades it, or the dodge roll wins. A decoy is reported by the
   * `dodgedEffects()` that follow.
   */
  public dodge(attacker: FightingCard): boolean {
    this.struckDecoy = this.decoyTakesAttack();
    if (this.struckDecoy || this.evades()) return true;

    return this.dodgeBehavior.dodge(
      this.agilityAgainst(attacker),
      attacker.accuracyAgainst(this),
    );
  }

  /** What a missed attack leaves: the decoy it struck, the weak points it spent. */
  public dodgedEffects(context: FightingContext): EffectResult[] {
    const decoy = this.struckDecoy;
    this.struckDecoy = undefined;

    return [
      ...(decoy ? [decoy] : []),
      ...this.strikeWeakPoints(context, false),
    ];
  }

  /** One roll against the first decoy pool of its side that has some left. */
  private decoyTakesAttack(): DecoyStruckResult | undefined {
    const pool = this.exposures.find((e) => e.decoys?.left > 0)?.decoys;
    if (!pool || this.randomizer.random() >= pool.chance) return undefined;

    pool.left--;
    return {
      type: DECOY_STRUCK_TYPE,
      card: this,
      name: pool.name,
      remainingDecoys: pool.left,
    };
  }

  /** One roll against the best evasion chance among the running stances. */
  private evades(): boolean {
    const chance = Math.max(
      0,
      ...this.stances.map((s) => s.evasionChance ?? 0),
    );
    if (chance <= 0) return false;

    return this.randomizer.random() < chance;
  }

  /** The agility this card dodges that attacker with, its insight included. */
  public agilityAgainst(attacker: FightingCard): number {
    const agility = attacker.deniesDodgeBonusOf(this)
      ? this.agilityWithoutBuffs
      : this.actualAgility;
    const insightRate = this.attackerInsight?.agilityRateAgainst(attacker) ?? 0;

    return agility + round2(this.agility * insightRate);
  }

  public deniesDodgeBonusOf(defender: FightingCard): boolean {
    return this.dodgeBonusDenial?.appliesTo(defender) ?? false;
  }

  /**
   * Applies a buff and returns it, or returns undefined when `stacking` caps
   * the pile it belongs to and that pile is already full. A refused
   * application changes nothing and is reported by nobody.
   */
  public applyBuff(
    buffType: AlterationType,
    buffRate: number,
    duration: number,
    terminationEvent?: string,
    powerId?: string,
    stacking?: AlterationStacking,
    { live, origin, terminationDamageRate }: AlterationOptions = {},
  ): Buff | undefined {
    if (isPileFull(this.buffs, stacking)) return undefined;

    const value = this.computeAttributeModifierValue(
      buffType,
      live?.rateFor(this) ?? buffRate,
    );
    const buff: Buff = {
      polarity: 'buff',
      type: buffType,
      value,
      duration,
      terminationEvent,
      powerId,
      stackId: stacking?.id,
      live,
      origin,
      terminationDamageRate,
    };

    if (terminationEvent && !stacking) {
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

  public removeEventBoundEffects(
    eventName: string,
  ): { type: StateEffectType; card: CardInfo }[] {
    const removed: { type: StateEffectType; card: CardInfo }[] = [];
    const card = this.identityInfo;

    if (this.poisoned?.terminationEvent === eventName) {
      removed.push({ type: this.poisoned.type, card });
      this.poisoned = undefined;
    }

    if (this.burned?.terminationEvent === eventName) {
      removed.push({ type: this.burned.type, card });
      this.burned = undefined;
    }

    if (this.frozen?.terminationEvent === eventName) {
      removed.push({ type: this.frozen.type, card });
      this.frozen = undefined;
    }

    if (this.stunted?.terminationEvent === eventName) {
      removed.push({ type: this.stunted.type, card });
      this.stunted = undefined;
    }

    if (this.hypothermic?.terminationEvent === eventName) {
      removed.push({ type: this.hypothermic.type, card });
      this.hypothermic = undefined;
    }

    if (this.entangled?.terminationEvent === eventName) {
      removed.push({ type: this.entangled.type, card });
      this.entangled = undefined;
    }

    if (this.bleeding?.removeStacksBoundTo(eventName)) {
      removed.push({ type: this.bleeding.type, card });
      if (!this.bleeding.stackCount) this.bleeding = undefined;
    }

    return removed;
  }

  /** `hitRate`: share of its max health the hit that fired the event cost the card. */
  public removeEventBoundBuffs(
    eventName: string,
    hitRate?: number,
  ): { type: AlterationType; value: number }[] {
    const ends = (b: Buff) => endsOn(b, eventName, hitRate);
    const removed = this.buffs
      .filter(ends)
      .map((b) => ({ type: b.type, value: b.value }));

    this.buffs = this.buffs.filter((b) => !ends(b));

    return removed;
  }

  public lifecycleEndEvents(): string[] {
    return this.skills
      .map((skill) => skill.lifecycleEndEvent?.())
      .filter((event): event is string => event !== undefined);
  }

  public decreaseBuffAndDebuffDuration(): {
    expiredBuffs: Buff[];
    expiredDebuffs: Debuff[];
  } {
    const decremented = this.buffs.map((b) => ({
      ...b,
      duration: b.duration - 1,
    }));
    const expiredBuffs = decremented.filter((b) => b.duration < 0);
    this.buffs = decremented.filter((b) => b.duration >= 0);

    const decrementedDebuffs = this.debuffs.map((d) => ({
      ...d,
      duration: d.duration - 1,
    }));
    const expiredDebuffs = decrementedDebuffs.filter((d) => d.duration < 0);
    this.debuffs = decrementedDebuffs.filter((d) => d.duration >= 0);

    return { expiredBuffs, expiredDebuffs };
  }

  /** Removes and returns every buff of that type, to hand it to another card. */
  public takeBuffs(type: AlterationType): Buff[] {
    const taken = this.buffs.filter((b) => b.type === type);
    this.buffs = this.buffs.filter((b) => b.type !== type);
    return taken;
  }

  /** Takes buffs as they are: value, remaining duration and stack pile. */
  public receiveBuffs(buffs: Buff[]): void {
    this.buffs.push(...buffs.map((buff) => ({ ...buff })));
  }

  public buffStacks(stackId: string): number {
    return stacksIn(this.buffs, stackId);
  }

  /**
   * Applies a debuff and returns it, or returns undefined when `stacking` caps
   * the pile it belongs to and that pile is already full, or when the card
   * resistance won the roll. A refused application changes nothing and is
   * reported by nobody.
   */
  public applyDebuff(
    debuffType: AlterationType,
    debuffRate: number,
    duration: number,
    terminationEvent?: string,
    powerId?: string,
    stacking?: AlterationStacking,
    { live, origin, terminationDamageRate }: AlterationOptions = {},
  ): Debuff | undefined {
    if (isPileFull(this.debuffs, stacking)) return undefined;

    if (this.resists()) return undefined;

    const debuff: Debuff = {
      polarity: 'debuff',
      type: debuffType,
      value: this.computeAttributeModifierValue(
        debuffType,
        live?.rateFor(this) ?? debuffRate,
      ),
      duration: duration,
      terminationEvent,
      powerId,
      stackId: stacking?.id,
      live,
      origin,
      terminationDamageRate,
    };

    this.debuffs.push(debuff);

    return debuff;
  }

  /** Whether the pile of that polarity already holds `maxStacks` alterations. */
  public isStackCapped(
    polarity: 'buff' | 'debuff',
    stacking?: AlterationStacking,
  ): boolean {
    return isPileFull(
      polarity === 'buff' ? this.buffs : this.debuffs,
      stacking,
    );
  }

  public debuffStacks(stackId: string): number {
    return stacksIn(this.debuffs, stackId);
  }

  public removeEventBoundDebuffs(
    eventName: string,
    hitRate?: number,
  ): { type: AlterationType; value: number }[] {
    const ends = (d: Debuff) => endsOn(d, eventName, hitRate);
    const removed = this.debuffs
      .filter(ends)
      .map((d) => ({ type: d.type, value: d.value }));

    this.debuffs = this.debuffs.filter((d) => !ends(d));

    return removed;
  }

  /**
   * Rolls the card resistance against one incoming status effect or stat
   * debuff. The refusal chance is the resistance over
   * `RESISTANCE_REFUSAL_DIVISOR`, so the 20-80 design range spans 10% to 40%.
   */
  private resists(): boolean {
    const resistance = this.actualResistance;
    if (resistance <= 0) return false;

    return this.randomizer.random() < resistance / RESISTANCE_REFUSAL_DIVISOR;
  }

  /**
   * Restores the regeneration stat as raw health points, and returns what was
   * actually healed — 0 at full health, where nothing is worth reporting.
   */
  public regenerate(): number {
    if (this.isDead()) return 0;

    return this.heal(this.actualRegeneration);
  }

  private computeActualStat(base: number, type: AlterationType): number {
    return Math.max(
      0,
      base + this.sumOf(this.buffs, type) - this.sumOf(this.debuffs, type),
    );
  }

  private get agilityWithoutBuffs(): number {
    return Math.max(0, this.agility - this.sumOf(this.debuffs, 'agility'));
  }

  /** A live alteration is worth what its rate gives on the board right now. */
  private sumOf(alterations: AlterationDetail[], type: AlterationType): number {
    return alterations
      .filter((alteration) => alteration.type === type)
      .reduce(
        (sum, alteration) =>
          sum +
          (alteration.live
            ? this.computeAttributeModifierValue(
                type,
                alteration.live.rateFor(this),
              )
            : alteration.value),
        0,
      );
  }

  private computeAttributeModifierValue(
    type: AlterationType,
    rate: number,
  ): number {
    switch (type) {
      case 'attack':
        return round2(rate * this.attack);
      case 'defense':
        return round2(rate * this.defense);
      case 'agility':
        return round2(rate * this.agility);
      case 'accuracy':
        return round2(rate * this.accuracy);
      case 'speed':
        return round2(rate * this.speed);
      case 'criticalChance':
        return round2(rate * this.criticalChance);
      case 'regeneration':
        return round2(rate * this.regeneration);
      case 'resistance':
        return round2(rate * this.resistance);
      default:
        throw new Error(`Unknown attribute type: ${type}`);
    }
  }
}

function endsOn(
  alteration: AlterationDetail,
  eventName: string,
  hitRate?: number,
): boolean {
  if (alteration.terminationEvent !== eventName) return false;
  if (alteration.terminationDamageRate === undefined) return true;

  return (hitRate ?? 0) > alteration.terminationDamageRate;
}

function isPileFull(
  alterations: AlterationDetail[],
  stacking?: AlterationStacking,
): boolean {
  if (!stacking) return false;
  return stacksIn(alterations, stacking.id) >= stacking.maxStacks;
}

function stacksIn(alterations: AlterationDetail[], stackId: string): number {
  return alterations.filter((a) => a.stackId === stackId).length;
}
