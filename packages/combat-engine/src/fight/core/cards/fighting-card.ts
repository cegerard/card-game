import type {
  BuffType,
  CardInfo,
  StateEffectType,
  WeakPointEndReason,
} from '@card-game/shared-types';
import { DamageType, Element, StatusCategory } from '@card-game/shared-types';
import { FightingContext } from './@types/fighting-context';
import { SpecialResult } from './@types/action-result/special-result';
import { DodgeBehavior } from './behaviors/dodge-behaviors';
import { AttackSkill } from './skills/attack-skill';
import { Special } from './skills/special';
import { CardState } from './@types/state/card-state';
import { StateResult } from './@types/action-result/state-result';
import { CardStateStackedPoison } from './@types/state/card-state-stacked-poison';
import { CardStatuses } from './@types/state/card-statuses';
import { BleedApplication } from './skills/bleed-empowerment';
import { CardBoundPassives } from './skills/card-bound-passives';
import { EffectLevel } from './@types/attack/effect-level';
import {
  Buff,
  Debuff,
  AlterationStacking,
} from './@types/alteration/alteration-detail';
import { Skill, SkillResults } from './skills/skill';
import { HealthReactiveSkill } from './skills/reactive-skill';
import { ElementalMark } from './@types/mark/elemental-mark';
import { TargetingCardStrategy } from '../targeting-card-strategies/targeting-card-strategy';
import { NamedAttackResult } from './@types/action-result/named-attack-result';
import { round2 } from '../../tools/round';
import { Randomizer } from '../randomizer';
import { Shield } from './@types/shield/shield';
import { ShieldSlot } from './@types/shield/shield-slot';
import { countDown } from './@types/count-down';
import { ElementalMarks } from './@types/mark/elemental-marks';
import { Stances } from './@types/stance/stances';
import { Stance, StanceActivation } from './@types/stance/stance';
import { Concealment } from './@types/concealment/concealment';
import { statusCategoryOf } from './@types/state/status-category';
import {
  WEAK_POINT_ENDED_TYPE,
  WeakPoint,
} from './@types/weak-point/weak-point';
import { WeakPoints } from './@types/weak-point/weak-points';
import {
  DECOY_STRUCK_TYPE,
  DecoyStruckResult,
  EffectResult,
  SUPPORT_BLOCK_ENDED_TYPE,
} from './@types/attack/attack-effect';
import {
  AlterationOptions,
  CardAlterations,
  RemovedAlteration,
} from './@types/alteration/card-alterations';
import {
  BattlefieldDeployment,
  BattlefieldExposure,
  DamageSharing,
} from './@types/battlefield/battlefield';
import { ElementalMatrix } from './damage/elemental-matrix';
import {
  VULNERABILITY_ENDED_TYPE,
  Vulnerability,
} from './@types/vulnerability/vulnerability';

/**
 * Turns the resistance stat into a refusal chance. Chosen so the 20-80 design
 * range of the stat spans 10% to 40% of incoming statuses and debuffs refused.
 */
const RESISTANCE_REFUSAL_DIVISOR = 200;

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

/** What is left of a hit after one defensive layer, and what the layer did. */
type LayerPass = { damage: number; report?: Partial<FinalDamageResult> };

type DamageLayer = (damage: number) => LayerPass;

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

  private readonly alterations = new CardAlterations(
    (type, rate) => this.computeAttributeModifierValue(type, rate),
    (live) => live.rateFor(this),
  );

  // Skills
  private simpleAttack: AttackSkill;
  private special: Special;
  private skills: Skill[];

  // Behaviors
  private dodgeBehavior: DodgeBehavior;

  private readonly shield = new ShieldSlot();

  private readonly marks = new ElementalMarks();

  // Lifesteal
  private lifesteal: Lifesteal | null = null;

  // Protection granted to one ally
  private protection: Protection | null = null;

  // Status immunity
  private statusImmunity: { remainingTurns: number } | null = null;

  // Transformation
  private transformation: Transformation | null = null;

  private readonly passives: CardBoundPassives;
  private attacked = false;

  private readonly stances = new Stances();

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
  private readonly statuses = new CardStatuses();
  private supportBlock: { remainingTurns: number } | null = null;
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
    } & CardBoundPassives,
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
    const { simpleAttack, special, others, ...passives } = skills;
    this.simpleAttack = simpleAttack;
    this.special = special;
    this.skills = others;
    this.passives = passives;
    this.dodgeBehavior = behaviors.dodge;
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
    const stackBonus =
      this.passives.bleedStackScaling?.multiplierFor(context) ?? 1;

    return this.actualAttack * stackBonus * this.targetBonusAgainst(defender);
  }

  /**
   * The bonus the low health target passive and the weak points this card
   * revealed on that defender grant against it.
   */
  public targetBonusAgainst(defender?: FightingCard): number {
    if (!defender) return 1;
    const lowHealthBonus =
      this.passives.lowHealthTargetBonus?.multiplierAgainst(defender) ?? 1;

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
      defender.weakPoints.accuracyRateFor(this) +
      (this.passives.attackerInsight?.accuracyRateAgainst(defender) ?? 0);

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
        (this.passives.poisonedEnemyAgility?.rateFor(this.poisonedCardCount) ??
          0),
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

  /** Whether the gauge holds a skill energy cost; no cost is always met. */
  public canAfford(cost = 0): boolean {
    return this.specialEnergy >= cost;
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
    return this.statuses.level('poison');
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
    return this.statuses.stackedPoison;
  }

  public get frozenLevel(): EffectLevel {
    return this.statuses.level('freeze');
  }

  public get isFrozen(): boolean {
    return this.statuses.has('freeze');
  }

  public get isStunted(): boolean {
    return this.statuses.has('stunt');
  }

  public get burnLevel(): EffectLevel {
    return this.statuses.level('burn');
  }

  public bleedStacks(): number {
    return this.statuses.bleeding?.stackCount ?? 0;
  }

  /** Removes every bleed stack and tells how many there were. */
  public consumeBleedStacks(): number {
    const stacks = this.bleedStacks();
    this.statuses.remove('bleed');

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
    return (
      this.passives.bleedEmpowerment?.empower(this, application) ?? application
    );
  }

  public get shielded(): boolean {
    return this.shield.isUp;
  }

  public holdsShield(name: string): boolean {
    return this.shield.holds(name);
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

    this.statuses.lay(newState);
    return true;
  }

  /** Removes one status the card suffers, picked at random; returns its type. */
  public cleanseRandomStatus(): StateEffectType | undefined {
    return this.statuses.cleanseRandom(this.randomizer);
  }

  public get isEntangled(): boolean {
    return this.statuses.has('entangle');
  }

  /** One roll in [0, 1), compared to the critical chance against each defender. */
  public criticalRoll(): number {
    return this.randomizer.random();
  }

  /**
   * Called when the card is about to act offensively: an entanglement goes
   * with that action, which fails on its chance. Returns whether it failed.
   */
  public failsOffensiveAction(): boolean {
    const entangled = this.statuses.consumeEntanglement();
    if (!entangled) return false;

    return this.randomizer.random() < entangled.failChance;
  }

  public unFreeze(): void {
    this.statuses.remove('freeze');
  }

  public unBurn(): void {
    this.statuses.remove('burn');
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
    if (this.isDead()) return [];

    return this.statuses.tick(this);
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
   * Resolves the damage of one hit: it goes through `damageLayers` in order,
   * then what is left comes off the health pool, where SURVIVE holds a fatal
   * blow at 1 HP.
   *
   * Status effect ticks go through `addRealDamage()` and bypass all of this.
   */
  public applyFinalDamage(damage: number): FinalDamageResult {
    this.recordHealthRatioBeforeDamage();
    let left = damage;
    let report: Partial<FinalDamageResult> = {};
    for (const layer of this.damageLayers) {
      const pass = layer(left);
      left = pass.damage;
      report = { ...report, ...pass.report };
    }

    return { shieldAbsorbed: 0, ...report, ...this.loseHealth(left) };
  }

  /**
   * The defensive layers of a hit, in order: freeze and stun amplify it, the
   * damage reduction removes a share, the damage sharing circle carries a
   * share, the shield absorbs what it can. Reducing before the shield absorbs
   * makes the shield last longer, which is the point of stacking both.
   */
  private readonly damageLayers: DamageLayer[] = [
    (damage) => ({ damage: this.statuses.amplify(damage) }),
    (damage) => this.mitigateHit(damage),
    (damage) => this.shareHit(damage),
    (damage) => this.absorbHit(damage),
  ];

  private mitigateHit(damage: number): LayerPass {
    const reduction = this.passives.damageReduction;
    const mitigated = reduction?.tryMitigate(damage);
    if (mitigated === undefined) return { damage };

    return {
      damage: mitigated,
      report: { mitigated: true, mitigatedSkillName: reduction.name },
    };
  }

  private shareHit(damage: number): LayerPass {
    const damageShared = this.shareDamage(damage);
    if (!damageShared) return { damage };

    return {
      damage: damage - damage * this.sharing.rate,
      report: { damageShared },
    };
  }

  private absorbHit(damage: number): LayerPass {
    const shieldAbsorbed = this.shield.absorb(damage);

    return { damage: damage - shieldAbsorbed, report: { shieldAbsorbed } };
  }

  private loseHealth(
    damage: number,
  ): Pick<
    FinalDamageResult,
    'damageToHealth' | 'survived' | 'survivedSkillName'
  > {
    const damageToHealth = Math.min(damage, this.actualHealth);
    const survive = this.passives.survive;
    if (this.actualHealth - damageToHealth <= 0 && survive?.tryConsume()) {
      const survivedDamage = this.actualHealth - 1;
      this.receivedDamages += survivedDamage;
      return {
        damageToHealth: survivedDamage,
        survived: true,
        survivedSkillName: survive.name,
      };
    }

    this.receivedDamages += damageToHealth;
    return { damageToHealth };
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
    this.alterations.extend(deployment.name, turns);
  }

  /** A battlefield laid again refreshes its alterations rather than stacking them. */
  public removeAlterationsFrom(origin: string): void {
    this.alterations.removeFrom(origin);
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
    this.statuses.clear();
    this.vulnerabilities = [];
    this.supportBlock = null;
    this.alterations.clear();
    this.shield.clear();
    this.stances.clear();
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
    return this.isStatusImmune || this.stances.grantImmunityTo(category);
  }

  public get isStatusImmune(): boolean {
    return this.statusImmunity !== null;
  }

  public decreaseStatusImmunityDuration(): void {
    this.statusImmunity = countDown(this.statusImmunity).left;
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
    const { left, ended } = countDown(this.transformation);
    this.transformation = left;
    if (!ended) return null;

    return {
      name: ended.name,
      healthCost: this.payTransformationCost(ended.endCostRate),
    };
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
    const { left, ended } = countDown(this.protection);
    this.protection = left;
    return ended?.ally ?? null;
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
    this.lifesteal = countDown(this.lifesteal).left;
  }

  /** Opens a stance on the card, or refreshes the one of that name. */
  public activateStance(activation: StanceActivation): Stance {
    return this.stances.activate(activation);
  }

  /** Whether a running stance lets the card see concealed enemies. */
  public seesConcealed(): boolean {
    return this.stances.revealConcealed;
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
    return this.stances.has(name);
  }

  /** Closes a running stance before its time; returns whether it was held. */
  public endStance(name: string): boolean {
    return this.stances.end(name);
  }

  /** Decrements every running stance and returns the ones that just ended. */
  public decreaseStanceDurations(): string[] {
    return this.stances.decreaseDurations();
  }

  /** `name` lets a live alteration tell this shield from another one. */
  public applyShield(rate: number, duration: number, name?: string): Shield {
    return this.applyShieldPoints(
      Math.round(rate * this.maxHealth),
      duration,
      name,
    );
  }

  /** A shield sized by somebody else than its bearer, such as its caster. */
  public applyShieldPoints(
    points: number,
    duration: number,
    name?: string,
  ): Shield {
    return this.shield.raise(points, duration, name);
  }

  public decreaseShieldDuration(): Shield | null {
    return this.shield.decreaseDuration();
  }

  public applyMark(mark: ElementalMark, stacks: number = 1): number {
    return this.marks.apply(mark, stacks);
  }

  public markStacks(damageType: DamageType): number {
    return this.marks.stacks(damageType);
  }

  public markAmplifier(damageType: DamageType): number {
    return this.marks.amplifier(damageType);
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
    if (this.passives.survive?.tryConsume()) {
      this.addRealDamage(this.actualHealth - 1);
      return { survived: true, survivedSkillName: this.passives.survive.name };
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
   * Resolves whether an attack aimed at the card misses it: a decoy of its
   * side takes it, else it is dodged. Returns what the missed attack leaves
   * (the decoy struck, the weak points spent), or undefined when it lands.
   */
  public missedBy(
    attacker: FightingCard,
    context: FightingContext,
  ): EffectResult[] | undefined {
    const decoy = this.decoyTakesAttack();
    if (!decoy && !this.dodge(attacker)) return undefined;

    return [
      ...(decoy ? [decoy] : []),
      ...this.strikeWeakPoints(context, false),
    ];
  }

  /** The stance evasion, then the dodge roll; decoys are `missedBy()` own. */
  public dodge(attacker: FightingCard): boolean {
    if (this.evades()) return true;

    return this.dodgeBehavior.dodge(
      this.agilityAgainst(attacker),
      attacker.accuracyAgainst(this),
    );
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
    const chance = this.stances.evasionChance;
    if (chance <= 0) return false;

    return this.randomizer.random() < chance;
  }

  /** The agility this card dodges that attacker with, its insight included. */
  public agilityAgainst(attacker: FightingCard): number {
    const agility = attacker.deniesDodgeBonusOf(this)
      ? this.agilityWithoutBuffs
      : this.actualAgility;
    const insightRate =
      this.passives.attackerInsight?.agilityRateAgainst(attacker) ?? 0;

    return agility + round2(this.agility * insightRate);
  }

  public deniesDodgeBonusOf(defender: FightingCard): boolean {
    return this.passives.dodgeBonusDenial?.appliesTo(defender) ?? false;
  }

  /**
   * Applies a buff and returns it, or returns undefined when `stacking` caps
   * the pile it belongs to and that pile is already full. A refused
   * application changes nothing and is reported by nobody.
   */
  public applyBuff(
    buffType: BuffType,
    buffRate: number,
    duration: number,
    terminationEvent?: string,
    powerId?: string,
    stacking?: AlterationStacking,
    options: AlterationOptions = {},
  ): Buff | undefined {
    if (this.alterations.isPileFull('buff', stacking)) return undefined;

    return this.alterations.addBuff({
      type: buffType,
      rate: buffRate,
      duration,
      terminationEvent,
      powerId,
      stacking,
      ...options,
    });
  }

  public removeEventBoundEffects(
    eventName: string,
  ): { type: StateEffectType; card: CardInfo }[] {
    return this.statuses.removeBoundTo(eventName, this.identityInfo);
  }

  /** `hitRate`: share of its max health the hit that fired the event cost the card. */
  public removeEventBoundBuffs(
    eventName: string,
    hitRate?: number,
  ): RemovedAlteration[] {
    return this.alterations.removeBoundTo('buff', eventName, hitRate);
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
    return this.alterations.decreaseDurations();
  }

  /** Removes and returns every buff of that type, to hand it to another card. */
  public takeBuffs(type: BuffType): Buff[] {
    return this.alterations.takeBuffs(type);
  }

  /** Takes buffs as they are: value, remaining duration and stack pile. */
  public receiveBuffs(buffs: Buff[]): void {
    this.alterations.receiveBuffs(buffs);
  }

  public buffStacks(stackId: string): number {
    return this.alterations.stacks('buff', stackId);
  }

  /**
   * Applies a debuff and returns it, or returns undefined when `stacking` caps
   * the pile it belongs to and that pile is already full, or when the card
   * resistance won the roll. A refused application changes nothing and is
   * reported by nobody.
   */
  public applyDebuff(
    debuffType: BuffType,
    debuffRate: number,
    duration: number,
    terminationEvent?: string,
    powerId?: string,
    stacking?: AlterationStacking,
    options: AlterationOptions = {},
  ): Debuff | undefined {
    if (this.alterations.isPileFull('debuff', stacking)) return undefined;
    if (this.resists()) return undefined;

    return this.alterations.addDebuff({
      type: debuffType,
      rate: debuffRate,
      duration,
      terminationEvent,
      powerId,
      stacking,
      ...options,
    });
  }

  /** Whether the pile of that polarity already holds `maxStacks` alterations. */
  public isStackCapped(
    polarity: 'buff' | 'debuff',
    stacking?: AlterationStacking,
  ): boolean {
    return this.alterations.isPileFull(polarity, stacking);
  }

  public debuffStacks(stackId: string): number {
    return this.alterations.stacks('debuff', stackId);
  }

  public removeEventBoundDebuffs(
    eventName: string,
    hitRate?: number,
  ): RemovedAlteration[] {
    return this.alterations.removeBoundTo('debuff', eventName, hitRate);
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

  private computeActualStat(base: number, type: BuffType): number {
    return Math.max(
      0,
      base +
        this.alterations.total('buff', type) -
        this.alterations.total('debuff', type),
    );
  }

  private get agilityWithoutBuffs(): number {
    return Math.max(
      0,
      this.agility - this.alterations.total('debuff', 'agility'),
    );
  }

  private computeAttributeModifierValue(type: BuffType, rate: number): number {
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
