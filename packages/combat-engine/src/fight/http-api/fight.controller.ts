import {
  Controller,
  Post,
  Body,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { FightResult } from '../core/fight-simulator/@types/fight-result';
import {
  AlterationConditionType,
  CardSelectorStrategy,
  Effect,
  EffectDto,
  BleedStackBonusDto,
  DamageTypeBonusDto,
  SpecialDto,
  EnergyRefundDto,
  ExecutionDto,
  FightDataDto,
  FightingCardDto,
  OtherSkillDto,
  EffectTriggeredDebuffDto,
  SpecialKind,
  SkillKind,
  BuffType,
  ElementDto,
  TriggerEvent,
  TargetingStrategy,
} from './dto/fight-data.dto';
import { FightingCard } from '../core/cards/fighting-card';
import { SpecialAttack } from '../core/cards/skills/special-attack';
import { SimpleAttack } from '../core/cards/skills/simple-attack';
import { buildTargetingStrategy } from './targeting-strategy-factory';
import { buildDodgeStrategy } from './dodge-strategy-factory';
import { buildAlterationCondition } from './alteration-condition-factory';
import { Special } from '../core/cards/skills/special';
import { SpecialHealing } from '../core/cards/skills/special-healing';
import { Healing } from '../core/cards/skills/healing';
import { AlterationSkill } from '../core/cards/skills/alteration-skill';
import { buildTriggerStrategy } from './trigger-factory';
import { Trigger } from '../core/trigger/trigger';
import { PoisonAttackEffect } from '../core/cards/@types/attack/attack-poison-effect';
import { EffectLevel } from '../core/cards/@types/attack/effect-level';
import { AttackEffect } from '../core/cards/@types/attack/attack-effect';
import { BurnAttackEffect } from '../core/cards/@types/attack/attack-burn-effect';
import { FreezeAttackEffect } from '../core/cards/@types/attack/attack-freeze-effect';
import { StuntAttackEffect } from '../core/cards/@types/attack/attack-stunt-effect';
import { Element } from '../core/cards/@types/damage/element';
import { MarkAttackEffect } from '../core/cards/@types/attack/attack-mark-effect';
import { BleedAttackEffect } from '../core/cards/@types/attack/attack-bleed-effect';
import { ElementalMark } from '../core/cards/@types/mark/elemental-mark';
import { MarkedTargetBonus } from '../core/cards/@types/mark/marked-target-bonus';
import { BleedStackBonus } from '../core/cards/@types/attack/bleed-stack-bonus';
import { ConcealedBonus } from '../core/cards/@types/attack/concealed-bonus';
import { DamageTypeBonus } from '../core/cards/@types/attack/damage-type-bonus';
import { EnergyRefund } from '../core/cards/@types/attack/energy-refund';
import { EffectTriggeredDebuff } from '../core/cards/@types/attack/effect-triggered-debuff';
import { MathRandomizer } from '../tools/math-randomizer';
import { Alteration } from '../core/cards/@types/alteration/alteration';
import { CardSelector } from '../core/fight-simulator/card-selectors/card-selector';
import { PlayerByPlayerCardSelector } from '../core/fight-simulator/card-selectors/player-by-player';
import { SpeedWeightedCardSelector } from '../core/fight-simulator/card-selectors/speed-weighted-card-pool';
import { Player } from '../core/player';
import { FightSimulator } from '../core/fight-simulator/@types/fight-simulator';
import { Skill } from '../core/cards/skills/skill';
import { TargetingOverrideSkill } from '../core/cards/skills/targeting-override';
import { ShieldSkill } from '../core/cards/skills/shield';
import { ProtectionSkill } from '../core/cards/skills/protection';
import { TransformationSkill } from '../core/cards/skills/transformation';
import { HealthThresholdCondition } from '../core/cards/@types/skill-activation-conditions/health-threshold-condition';
import { DamageComposition } from '../core/cards/@types/damage/damage-composition';
import { ConditionalAttack } from '../core/cards/skills/conditional-attack';
import { EveryNTurnsCondition } from '../core/cards/@types/attack/conditions/every-n-turns-condition';
import { AlwaysTrueAttackCondition } from '../core/cards/@types/attack/conditions/always-true-attack-condition';
import { AttackCondition } from '../core/cards/@types/attack/attack-condition';
import { AllyHealthBelowThresholdTrigger } from '../core/trigger/ally-health-below-threshold-trigger';
import { AnyAllyHealthBelowThresholdTrigger } from '../core/trigger/any-ally-health-below-threshold-trigger';
import { SelfDeathTrigger } from '../core/trigger/self-death';
import { BleedStacksAppliedTrigger } from '../core/trigger/bleed-stacks-applied';
import { StanceSkill } from '../core/cards/skills/stance';
import { BleedExplosionSkill } from '../core/cards/skills/bleed-explosion';
import { FirstBleedingEnemyStrategy } from '../core/targeting-card-strategies/first-bleeding-enemy';
import { BleedDetonation } from '../core/cards/@types/attack/bleed-detonation';
import { Splash } from '../core/cards/@types/attack/splash';
import { LowHealthDebuff } from '../core/cards/@types/attack/low-health-debuff';
import { LastAttackerOfAllyTargetingStrategy } from '../core/targeting-card-strategies/last-attacker-of-ally';
import { AlliedCardByIdStrategy } from '../core/targeting-card-strategies/allied-card-by-id';
import { MultipleAttack } from '../core/cards/skills/multiple-attack';
import { AttackSkill } from '../core/cards/skills/attack-skill';
import { TargetedCard } from '../core/targeting-card-strategies/targeted-card';
import { validatePowerIdConsistency } from '../core/cards/skills/power-id-consistency';
import { ShieldApplication } from '../core/cards/@types/shield/shield-application';
import { SurviveSkill } from '../core/cards/skills/survive';
import { AlterationStacking } from '../core/cards/@types/alteration/alteration-detail';
import { DamageReductionSkill } from '../core/cards/skills/damage-reduction';
import { DodgeBonusDenialSkill } from '../core/cards/skills/dodge-bonus-denial';
import { BleedStackScalingSkill } from '../core/cards/skills/bleed-stack-scaling';
import { LowHealthTargetBonusSkill } from '../core/cards/skills/low-health-target-bonus';
import { HitAlterations } from '../core/cards/@types/attack/hit-alterations';
import { Execution } from '../core/cards/@types/attack/execution';
import { BleedEmpowermentSkill } from '../core/cards/skills/bleed-empowerment';
import { ConcealmentSkill } from '../core/cards/skills/concealment';
import { EnemyKilledTrigger } from '../core/trigger/enemy-killed';
import { SpecialStance } from '../core/cards/skills/special-stance';

// What only a special that strikes can carry
const STANCE_SPECIAL_FORBIDDEN_FIELDS = [
  'damages',
  'rate',
  'hits',
  'targetingStrategy',
  'effect',
  'energyRefund',
  'markedTargetBonus',
  'bleedStackBonus',
  'concealedBonus',
  'execution',
] as const;

// Fields that only some skill kinds can carry
const KIND_ONLY_FIELDS: {
  kinds: SkillKind[];
  fields: (keyof OtherSkillDto)[];
}[] = [
  {
    kinds: [SkillKind.BLEED_EMPOWERMENT],
    fields: ['extraStacks', 'basis', 'triggeredDebuff'],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK],
    fields: ['hitAlterations', 'endsStance', 'execution'],
  },
  {
    kinds: [SkillKind.CONDITIONAL_ATTACK, SkillKind.CONCEALMENT],
    fields: ['requiresUndamaged', 'interval'],
  },
];

const CARD_BOUND_SKILL_KINDS = [
  SkillKind.SURVIVE,
  SkillKind.DAMAGE_REDUCTION,
  SkillKind.DODGE_BONUS_DENIAL,
  SkillKind.BLEED_STACK_SCALING,
  SkillKind.BLEED_EMPOWERMENT,
  SkillKind.LOW_HEALTH_TARGET_BONUS,
];

@Controller()
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class FightController {
  constructor(
    @Inject('FIGHT_SIMULATOR_BUILDER')
    private readonly buildFightSimulator: (
      player1: Player,
      player2: Player,
      cardSelector: CardSelector,
    ) => FightSimulator,
  ) {}

  @Post('fight')
  @HttpCode(200)
  startFight(@Body() fightData: FightDataDto): FightResult {
    const player1Deck = fightData.player1.deck.map((card) =>
      this.convertCardDtoToCard(card),
    );
    const player2Deck = fightData.player2.deck.map((card) =>
      this.convertCardDtoToCard(card),
    );

    const player1 = new Player(fightData.player1.name, player1Deck);
    const player2 = new Player(fightData.player2.name, player2Deck);

    const fightSimulator = this.buildFightSimulator(
      player1,
      player2,
      this.getSelectorStrategy(
        fightData.cardSelectorStrategy,
        player1,
        player2,
      ),
    );

    return fightSimulator.start();
  }

  private convertCardDtoToCard(cardData: FightingCardDto): FightingCard {
    let special: Special;

    const specialEffect = cardData.skills.special.effect
      ? this.buildEffect(cardData.skills.special.effect)
      : undefined;

    if (
      cardData.skills.special.concealment &&
      cardData.skills.special.kind !== SpecialKind.STANCE
    ) {
      throw new BadRequestException(
        'Only a STANCE special can conceal its caster: an attack would reveal it at once',
      );
    }

    if (cardData.skills.special.kind === SpecialKind.ATTACK) {
      const alterations = this.buildSpecialAlterations(cardData.skills.special);

      const rawDamages = cardData.skills.special.damages;
      if (!rawDamages || rawDamages.length === 0) {
        throw new Error(
          'Special attack requires at least one damage composition',
        );
      }
      const specialDamages = rawDamages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      const shieldApplication = this.buildShieldApplication(
        cardData.skills.special,
      );

      const markedBonusDto = cardData.skills.special.markedTargetBonus;
      const markedTargetBonus = markedBonusDto
        ? new MarkedTargetBonus(
            markedBonusDto.damageType,
            markedBonusDto.multiplier,
          )
        : undefined;

      special = new SpecialAttack(
        cardData.skills.special.name,
        specialDamages,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
        specialEffect,
        alterations.length > 0 ? alterations : undefined,
        shieldApplication,
        markedTargetBonus,
        cardData.skills.special.stanceActivation,
        cardData.skills.special.hits,
        this.buildDamageBonuses(cardData.skills.special),
        this.buildEnergyRefund(cardData.skills.special.energyRefund),
        this.buildExecution(cardData.skills.special.execution),
      );
    } else if (cardData.skills.special.kind === SpecialKind.STANCE) {
      special = this.buildSpecialStance(cardData.skills.special);
    } else if (cardData.skills.special.kind === SpecialKind.HEALING) {
      special = new SpecialHealing(
        cardData.skills.special.name,
        cardData.skills.special.rate,
        cardData.skills.special.energy,
        buildTargetingStrategy(cardData.skills.special.targetingStrategy),
      );
    } else {
      throw new Error(`Unknown SpecialKind: ${cardData.skills.special.kind}`);
    }

    let attackSkill: AttackSkill;

    if (cardData.skills.multipleAttack) {
      const ma = cardData.skills.multipleAttack;
      const maDamages = ma.damages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      const maEffects = this.buildEffects(ma.effects);
      const maComboFinisher = ma.comboFinisher
        ? ma.comboFinisher.map((d) => new DamageComposition(d.type, d.rate))
        : undefined;
      attackSkill = new MultipleAttack(
        ma.name,
        ma.hits,
        maDamages,
        buildTargetingStrategy(ma.targetingStrategy),
        ma.amplifier ?? 0,
        maEffects,
        maComboFinisher,
        this.buildEffects(ma.comboFinisherEffects),
        this.buildDamageBonuses(ma),
      );
    } else {
      const sa = cardData.skills.simpleAttack;
      if (!sa) {
        throw new Error(
          'Either simpleAttack or multipleAttack must be provided',
        );
      }
      const saEffects = this.buildEffects(sa.effects);
      const damages = sa.damages.map(
        (d) => new DamageComposition(d.type, d.rate),
      );
      attackSkill = new SimpleAttack(
        sa.name,
        damages,
        buildTargetingStrategy(sa.targetingStrategy),
        saEffects,
        this.buildDamageBonuses(sa),
      );
    }

    const surviveDto = cardData.skills.others.find(
      (s) => s.kind === SkillKind.SURVIVE,
    );
    const surviveSkill = surviveDto
      ? new SurviveSkill(surviveDto.name)
      : undefined;
    const damageReduction = this.buildDamageReduction(cardData.skills.others);
    const dodgeBonusDenialDto = cardData.skills.others.find(
      (s) => s.kind === SkillKind.DODGE_BONUS_DENIAL,
    );
    const dodgeBonusDenial = dodgeBonusDenialDto
      ? new DodgeBonusDenialSkill(dodgeBonusDenialDto.name)
      : undefined;
    const bleedStackScalingDto = cardData.skills.others.find(
      (s) => s.kind === SkillKind.BLEED_STACK_SCALING,
    );
    const bleedStackScaling = bleedStackScalingDto
      ? new BleedStackScalingSkill(
          bleedStackScalingDto.name,
          bleedStackScalingDto.rate,
          bleedStackScalingDto.maxRate,
        )
      : undefined;
    this.rejectMisplacedKindOnlyFields(cardData.skills.others);
    const bleedEmpowermentDto = cardData.skills.others.find(
      (s) => s.kind === SkillKind.BLEED_EMPOWERMENT,
    );
    const bleedEmpowerment = this.buildBleedEmpowerment(bleedEmpowermentDto);
    const lowHealthTargetBonus = this.buildLowHealthTargetBonus(
      cardData.skills.others.find(
        (s) => s.kind === SkillKind.LOW_HEALTH_TARGET_BONUS,
      ),
    );

    // The CARD_BOUND_SKILL_KINDS carry no trigger and no
    // targeting: they live on the card itself and are consulted when a hit is
    // resolved, so they are pulled out before the regular skill loop.
    const triggeredOthers = cardData.skills.others.filter(
      (s) => !CARD_BOUND_SKILL_KINDS.includes(s.kind),
    );

    try {
      validatePowerIdConsistency(
        triggeredOthers
          .filter((s) => s.event !== undefined)
          .map((s) => ({
            powerId: s.powerId,
            event: s.event as string,
            terminationEvent: s.terminationEvent,
          })),
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }

    const otherSkills: Skill[] = triggeredOthers.map((skill) =>
      this.createOtherSkill(skill, cardData.id),
    );

    return new FightingCard(
      cardData.id,
      cardData.name,
      cardData,
      {
        special,
        simpleAttack: attackSkill,
        others: otherSkills,
        survive: surviveSkill,
        damageReduction,
        dodgeBonusDenial,
        bleedStackScaling,
        bleedEmpowerment,
        lowHealthTargetBonus,
      },
      {
        dodge: buildDodgeStrategy(cardData.behaviors.dodge),
      },
      new MathRandomizer(),
      this.mapElement(cardData.element),
    );
  }

  private buildLowHealthTargetBonus(
    dto: OtherSkillDto | undefined,
  ): LowHealthTargetBonusSkill | undefined {
    if (!dto) return undefined;
    if (dto.activationCondition?.threshold === undefined) {
      throw new BadRequestException(
        `${dto.kind} requires activationCondition.threshold`,
      );
    }
    try {
      return new LowHealthTargetBonusSkill(
        dto.name,
        dto.rate,
        dto.activationCondition.threshold,
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  /**
   * Maps the DTO element onto its domain counterpart. The two enums carry the
   * same string values, but going through an explicit map keeps an unknown
   * element loud instead of silently reaching the elemental matrix.
   */
  private mapElement(element?: ElementDto): Element {
    if (element === undefined) return Element.PHYSICAL;

    const ELEMENT_MAP: Record<ElementDto, Element> = {
      [ElementDto.PHYSICAL]: Element.PHYSICAL,
      [ElementDto.FIRE]: Element.FIRE,
      [ElementDto.WATER]: Element.WATER,
      [ElementDto.EARTH]: Element.EARTH,
      [ElementDto.AIR]: Element.AIR,
    };

    const result = ELEMENT_MAP[element];
    if (!result) throw new Error(`Unknown element: ${element}`);
    return result;
  }

  private buildEffects(effectDtos?: EffectDto[]): AttackEffect[] | undefined {
    if (!effectDtos?.length) return undefined;
    return effectDtos.map((dto) => this.buildEffect(dto));
  }

  private buildEffect(effectDto: EffectDto): AttackEffect {
    const triggeredDebuff = this.buildTriggeredDebuff(
      effectDto.triggeredDebuff,
    );

    switch (effectDto.type) {
      case Effect.POISON:
        return new PoisonAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          new MathRandomizer(),
          triggeredDebuff,
          effectDto.terminationEvent,
          effectDto.probability,
        );
      case Effect.BURN:
        return new BurnAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          new MathRandomizer(),
          triggeredDebuff,
          effectDto.terminationEvent,
          effectDto.probability,
        );
      case Effect.FREEZE:
        return new FreezeAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          new MathRandomizer(),
          triggeredDebuff,
          effectDto.terminationEvent,
          effectDto.probability,
        );
      case Effect.STUNT:
        return new StuntAttackEffect(
          effectDto.rate,
          effectDto.level as EffectLevel,
          new MathRandomizer(),
          effectDto.probability,
          effectDto.terminationEvent,
        );
      case Effect.MARK:
        return new MarkAttackEffect(
          new ElementalMark(
            effectDto.damageType,
            effectDto.rate,
            effectDto.maxStacks,
          ),
          new MathRandomizer(),
          effectDto.stacks,
          effectDto.probability,
          triggeredDebuff,
        );
      case Effect.BLEED:
        return new BleedAttackEffect(
          effectDto.rate,
          effectDto.duration,
          effectDto.maxStacks,
          new MathRandomizer(),
          effectDto.stacks,
          effectDto.probability,
          triggeredDebuff,
          effectDto.terminationEvent,
          effectDto.basis,
        );
    }
  }

  private buildTriggeredDebuff(
    dto: EffectTriggeredDebuffDto | undefined,
  ): EffectTriggeredDebuff | undefined {
    if (!dto) return undefined;

    return new EffectTriggeredDebuff(
      dto.probability,
      this.mapAlterationType(dto.debuffType),
      dto.debuffRate,
      dto.duration,
      new MathRandomizer(),
      dto.terminationEvent,
      dto.powerId,
      this.buildAlterationStacking(
        dto.stackId,
        dto.maxStacks,
        ` triggeredDebuff`,
      ),
    );
  }

  private rejectMisplacedKindOnlyFields(others: OtherSkillDto[]): void {
    for (const skill of others) {
      const misplaced = KIND_ONLY_FIELDS.filter(
        ({ kinds }) => !kinds.includes(skill.kind),
      )
        .flatMap(({ fields }) => fields)
        .filter((field) => skill[field] !== undefined);
      if (misplaced.length > 0) {
        throw new BadRequestException(
          `${skill.kind} skill cannot carry: ${misplaced.join(', ')}`,
        );
      }
    }
  }

  private buildBleedEmpowerment(
    dto: OtherSkillDto | undefined,
  ): BleedEmpowermentSkill | undefined {
    if (!dto) return undefined;

    const triggeredDebuff = this.buildTriggeredDebuff(dto.triggeredDebuff);
    try {
      return new BleedEmpowermentSkill(
        dto.name,
        dto.requiresStance,
        dto.extraStacks,
        dto.rate,
        { duration: dto.duration, basis: dto.basis, triggeredDebuff },
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  private asBadRequest<T>(build: () => T): T {
    try {
      return build();
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  private buildEnergyRefund(
    dto: EnergyRefundDto | undefined,
  ): EnergyRefund | undefined {
    if (!dto) return undefined;

    return new EnergyRefund(dto.amount, dto.minAccuracyMargin);
  }

  private buildSpecialStance(dto: SpecialDto): SpecialStance {
    const strikingFields = STANCE_SPECIAL_FORBIDDEN_FIELDS.filter(
      (field) => dto[field] !== undefined,
    );
    if (strikingFields.length > 0) {
      throw new BadRequestException(
        `STANCE special strikes nobody and cannot carry: ${strikingFields.join(', ')}`,
      );
    }

    return new SpecialStance(
      dto.name,
      dto.energy,
      dto.stanceActivation,
      this.buildSpecialAlterations(dto),
      this.buildShieldApplication(dto),
      dto.concealment?.duration,
    );
  }

  private buildSpecialAlterations(dto: SpecialDto): Alteration[] {
    return (dto.statAlterations ?? []).map((a) => {
      const condition = a.condition
        ? buildAlterationCondition(a.condition.type, {
            allyName: a.condition.allyName,
          })
        : undefined;
      return new Alteration(
        this.mapAlterationType(a.type),
        a.rate,
        a.duration,
        buildTargetingStrategy(a.targetingStrategy),
        condition,
        a.condition?.multiplier,
        a.terminationEvent,
        a.polarity,
      );
    });
  }

  private buildExecution(dto?: ExecutionDto): Execution | undefined {
    return dto && this.asBadRequest(() => new Execution(dto.threshold));
  }

  private buildCooldown(interval?: number): AttackCondition {
    return interval
      ? new EveryNTurnsCondition(interval)
      : new AlwaysTrueAttackCondition();
  }

  private buildHitAlterations(dto: OtherSkillDto): HitAlterations | undefined {
    if (!dto.hitAlterations?.length) return undefined;

    return new HitAlterations(
      dto.hitAlterations.map((a) => ({
        polarity: a.polarity,
        type: this.mapAlterationType(a.type),
        rate: a.rate,
        duration: a.duration,
        terminationEvent: a.terminationEvent,
      })),
    );
  }

  private buildShieldApplication(
    dto: SpecialDto,
  ): ShieldApplication | undefined {
    const shieldDto = dto.shieldApplication;
    if (!shieldDto) return undefined;

    return new ShieldApplication(
      shieldDto.rate,
      shieldDto.duration,
      buildTargetingStrategy(shieldDto.targetingStrategy),
    );
  }

  private buildDamageBonuses(attack: {
    bleedStackBonus?: BleedStackBonusDto;
    concealedBonus?: DamageTypeBonusDto;
  }): DamageTypeBonus[] {
    const { bleedStackBonus, concealedBonus } = attack;
    const bonuses: DamageTypeBonus[] = [];

    if (bleedStackBonus) {
      bonuses.push(
        new BleedStackBonus(
          bleedStackBonus.minStacks,
          bleedStackBonus.damageType,
          bleedStackBonus.multiplier,
        ),
      );
    }
    if (concealedBonus) {
      bonuses.push(
        new ConcealedBonus(
          concealedBonus.damageType,
          concealedBonus.multiplier,
        ),
      );
    }

    return bonuses;
  }

  /**
   * The domain rejects an out-of-range rate. That is a malformed request, not
   * a server fault, so it surfaces as a 400 like the composite power check.
   */
  private buildDamageReduction(
    skills: OtherSkillDto[],
  ): DamageReductionSkill | undefined {
    const dto = skills.find((s) => s.kind === SkillKind.DAMAGE_REDUCTION);
    if (!dto) return undefined;

    try {
      return new DamageReductionSkill(
        dto.name,
        dto.rate,
        new MathRandomizer(),
        dto.probability,
      );
    } catch (e) {
      throw new BadRequestException((e as Error).message);
    }
  }

  /**
   * A stack budget needs both its id and its cap: half of one is a malformed
   * request, not a silent no-cap, so it is rejected rather than ignored.
   */
  private buildAlterationStacking(
    stackId: string | undefined,
    maxStacks: number | undefined,
    owner: string,
  ): AlterationStacking | undefined {
    if (stackId === undefined && maxStacks === undefined) return undefined;
    if (stackId === undefined || maxStacks === undefined) {
      throw new BadRequestException(
        `${owner} requires both stackId and a max stacks value to cap an alteration pile`,
      );
    }
    return { id: stackId, maxStacks };
  }

  /**
   * Resolves the targeting a triggered skill declares. Some strategies name
   * their target up front (`targetCardId`), others resolve it against the live
   * board from a health threshold, so both are handed over.
   */
  private buildSkillTargeting(skillData: OtherSkillDto) {
    if (
      skillData.targetingStrategy === TargetingStrategy.FIRST_BLEEDING_ENEMY
    ) {
      return new FirstBleedingEnemyStrategy(skillData.stackThreshold);
    }
    const threshold =
      skillData.targetingStrategy === TargetingStrategy.MOST_WOUNDED_ALLY
        ? this.requireThreshold(skillData, skillData.targetingStrategy)
        : skillData.activationCondition?.threshold;

    return buildTargetingStrategy(
      skillData.targetingStrategy,
      skillData.targetCardId,
      threshold,
    );
  }

  /**
   * Whether the skill event already consumes `activationCondition` as its own
   * threshold. It then says "an ally fell low", and reusing it as the skill
   * activation condition would gate the skill a second time on the *caster*
   * health — a guardian in perfect shape would never answer its wounded ally.
   */
  private ownsActivationCondition(skillData: OtherSkillDto): boolean {
    return (
      skillData.event === TriggerEvent.ANY_ALLY_HEALTH_BELOW ||
      skillData.event === TriggerEvent.ENEMY_KILLED
    );
  }

  private buildSkillActivationCondition(skillData: OtherSkillDto) {
    if (!skillData.activationCondition) return undefined;

    return buildAlterationCondition(skillData.activationCondition.type, {
      allyName: skillData.activationCondition.allyName,
      threshold: skillData.activationCondition.threshold,
      operator: skillData.activationCondition.operator,
      probability: skillData.activationCondition.probability,
    });
  }

  /** The stack cap of a skill, `debuffMaxStacks` being the former name of `maxStacks`. */
  private resolveMaxStacks(skillData: OtherSkillDto): number | undefined {
    const { maxStacks, debuffMaxStacks } = skillData;
    if (
      maxStacks !== undefined &&
      debuffMaxStacks !== undefined &&
      maxStacks !== debuffMaxStacks
    ) {
      throw new BadRequestException(
        `${skillData.kind} ${skillData.name}: maxStacks and its alias debuffMaxStacks disagree`,
      );
    }
    return maxStacks ?? debuffMaxStacks;
  }

  /**
   * The health threshold both the any-ally trigger and the most-wounded-ally
   * targeting read. Missing, it is malformed input rather than a runtime
   * failure, so it answers 400 like the other domain checks here.
   */
  private requireThreshold(skillData: OtherSkillDto, requiredBy: string) {
    const threshold = skillData.activationCondition?.threshold;
    if (threshold === undefined) {
      throw new BadRequestException(
        `${requiredBy} requires activationCondition.threshold`,
      );
    }
    return threshold;
  }

  private buildTriggerForSkill(
    skillData: OtherSkillDto,
    ownerId: string,
  ): Trigger {
    // A card reacting to its own death names nobody: the trigger is its own id.
    if (skillData.event === TriggerEvent.SELF_DEATH) {
      return new SelfDeathTrigger(ownerId);
    }

    if (skillData.event === TriggerEvent.ENEMY_KILLED) {
      const condition = skillData.activationCondition;
      if (
        condition?.type !== undefined &&
        condition.type !== AlterationConditionType.HEALTH_THRESHOLD
      ) {
        throw new BadRequestException(
          'enemy-killed activationCondition must be of type health-threshold',
        );
      }
      if (condition?.operator !== undefined || condition?.allyName) {
        throw new BadRequestException(
          'enemy-killed activationCondition only accepts type and threshold',
        );
      }
      try {
        return new EnemyKilledTrigger(skillData.activationCondition?.threshold);
      } catch (e) {
        throw new BadRequestException((e as Error).message);
      }
    }

    if (skillData.event === TriggerEvent.BLEED_STACKS_APPLIED) {
      return new BleedStacksAppliedTrigger(skillData.stackThreshold);
    }

    if (skillData.event === TriggerEvent.ANY_ALLY_HEALTH_BELOW) {
      return new AnyAllyHealthBelowThresholdTrigger(
        this.requireThreshold(skillData, skillData.event),
        ownerId,
      );
    }

    const dormantConfig =
      skillData.event === TriggerEvent.DORMANT
        ? {
            activationEvent: skillData.activationEvent,
            activationTargetCardId: skillData.activationTargetCardId,
            replacementEvent: skillData.replacementEvent,
          }
        : undefined;
    return buildTriggerStrategy(
      skillData.event,
      skillData.targetCardId,
      dormantConfig,
    );
  }

  private createOtherSkill(skillData: OtherSkillDto, ownerId: string): Skill {
    switch (skillData.kind) {
      case SkillKind.HEALING:
        return new Healing(
          skillData.name,
          skillData.rate,
          this.buildTriggerForSkill(skillData, ownerId),
          this.buildSkillTargeting(skillData),
          skillData.powerId,
          skillData.activationLimit,
          skillData.endEvent,
          skillData.healBasis,
        );
      case SkillKind.ALTERATION:
        if (!skillData.buffType) {
          throw new Error('Alteration skill requires buffType');
        }
        if (!skillData.polarity) {
          throw new Error('Alteration skill requires polarity');
        }
        if (skillData.event === TriggerEvent.ALLY_HEALTH_BELOW) {
          this.requireAllyHealthBelowFields(skillData);
          return new AlterationSkill({
            name: skillData.name,
            polarity: skillData.polarity,
            attributeType: this.mapAlterationType(skillData.buffType),
            rate: skillData.rate,
            duration:
              skillData.duration === 0 ? Infinity : (skillData.duration ?? 0),
            trigger: new AllyHealthBelowThresholdTrigger(
              skillData.targetCardId,
              skillData.activationCondition.threshold,
            ),
            targetingStrategy: new AlliedCardByIdStrategy(
              skillData.targetCardId,
            ),
            powerId: skillData.powerId,
          });
        }
        const alterationCondition = this.ownsActivationCondition(skillData)
          ? undefined
          : this.buildSkillActivationCondition(skillData);
        // duration: 0 means infinite — either permanent (no terminationEvent)
        // or event-bound (removed when terminationEvent fires via EndEventProcessor).
        // The domain uses Infinity to bypass the turn-decrement filter.
        const alterationDuration =
          skillData.duration === 0 ? Infinity : (skillData.duration ?? 0);
        return new AlterationSkill({
          name: skillData.name,
          polarity: skillData.polarity,
          attributeType: this.mapAlterationType(skillData.buffType),
          rate: skillData.rate,
          duration: alterationDuration,
          trigger: this.buildTriggerForSkill(skillData, ownerId),
          targetingStrategy: this.buildSkillTargeting(skillData),
          activationCondition: alterationCondition,
          stacking: this.buildAlterationStacking(
            skillData.stackId,
            this.resolveMaxStacks(skillData),
            `${skillData.kind} ${skillData.name}`,
          ),
          activationLimit: skillData.activationLimit,
          endEvent: skillData.endEvent,
          terminationEvent: skillData.terminationEvent,
          powerId: skillData.powerId,
        });
      case SkillKind.CONDITIONAL_ATTACK:
        if (skillData.event === TriggerEvent.ALLY_HEALTH_BELOW) {
          this.requireAllyHealthBelowFields(skillData);
          const ahDamages = skillData.damages.map(
            (d) => new DamageComposition(d.type, d.rate),
          );
          const ahEffects = skillData.effect
            ? [this.buildEffect(skillData.effect)]
            : undefined;
          const ahAttackSkill = new SimpleAttack(
            skillData.name,
            ahDamages,
            new LastAttackerOfAllyTargetingStrategy(skillData.targetCardId),
            ahEffects,
            undefined,
            skillData.defensePenetration,
          );
          const ahTrigger = new AllyHealthBelowThresholdTrigger(
            skillData.targetCardId,
            skillData.activationCondition.threshold,
          );
          return this.asBadRequest(
            () =>
              new ConditionalAttack(
                skillData.name,
                ahAttackSkill,
                new AlwaysTrueAttackCondition(),
                ahTrigger,
                skillData.powerId,
                skillData.requiresStance,
                undefined,
                undefined,
                undefined,
                undefined,
                skillData.requiresUndamaged,
                this.buildHitAlterations(skillData),
                skillData.endsStance,
                this.buildExecution(skillData.execution),
              ),
          );
        }
        if (skillData.bleedDetonation && skillData.hits) {
          throw new BadRequestException(
            'CONDITIONAL_ATTACK bleedDetonation cannot be combined with hits',
          );
        }
        const caDamages = (skillData.damages ?? []).map(
          (d) => new DamageComposition(d.type, d.rate),
        );
        const caEffects = skillData.effect
          ? [this.buildEffect(skillData.effect)]
          : undefined;
        const caComboFinisher = skillData.comboFinisher
          ? skillData.comboFinisher.map(
              (d) => new DamageComposition(d.type, d.rate),
            )
          : undefined;
        const caAttackSkill = skillData.hits
          ? new MultipleAttack(
              skillData.name,
              skillData.hits,
              caDamages,
              this.buildSkillTargeting(skillData),
              skillData.amplifier ?? 0,
              caEffects,
              caComboFinisher,
              this.buildEffects(skillData.comboFinisherEffects),
              undefined,
              skillData.defensePenetration,
            )
          : new SimpleAttack(
              skillData.name,
              caDamages,
              this.buildSkillTargeting(skillData),
              caEffects,
              undefined,
              skillData.defensePenetration,
              skillData.bleedDetonation
                ? new BleedDetonation(skillData.bleedDetonation.ratePerStack)
                : undefined,
            );
        return this.asBadRequest(
          () =>
            new ConditionalAttack(
              skillData.name,
              caAttackSkill,
              this.buildCooldown(skillData.interval),
              this.buildTriggerForSkill(skillData, ownerId),
              skillData.powerId,
              skillData.requiresStance,
              skillData.energyCost,
              skillData.splash
                ? new Splash(
                    skillData.splash.name,
                    skillData.splash.damages.map(
                      (d) => new DamageComposition(d.type, d.rate),
                    ),
                    this.buildEffects(skillData.splash.effects),
                  )
                : undefined,
              skillData.onLowHealthAfterHit
                ? new LowHealthDebuff(
                    skillData.onLowHealthAfterHit.name,
                    skillData.onLowHealthAfterHit.threshold,
                    skillData.onLowHealthAfterHit.debuffs.map((debuff) => ({
                      type: this.mapAlterationType(debuff.type),
                      rate: debuff.rate,
                      duration: debuff.duration,
                    })),
                  )
                : undefined,
              skillData.stanceActivation,
              skillData.requiresUndamaged,
              this.buildHitAlterations(skillData),
              skillData.endsStance,
              this.buildExecution(skillData.execution),
            ),
        );
      case SkillKind.TARGETING_OVERRIDE:
        if (!skillData.terminationEvent) {
          throw new Error('Targeting override skill requires terminationEvent');
        }
        if (skillData.targetingStrategy === TargetingStrategy.TARGETED_CARD) {
          return new TargetingOverrideSkill(
            skillData.name,
            undefined,
            skillData.terminationEvent,
            this.buildTriggerForSkill(skillData, ownerId),
            skillData.powerId,
            (ctx) => {
              if (!ctx.killerCard) return null;
              return new TargetedCard(ctx.killerCard.id);
            },
          );
        }
        return new TargetingOverrideSkill(
          skillData.name,
          this.buildSkillTargeting(skillData),
          skillData.terminationEvent,
          this.buildTriggerForSkill(skillData, ownerId),
          skillData.powerId,
        );
      case SkillKind.TRANSFORMATION: {
        const threshold = skillData.activationCondition?.threshold;
        if (threshold === undefined) {
          throw new Error(
            'TRANSFORMATION skill requires an activationCondition threshold',
          );
        }
        return new TransformationSkill({
          name: skillData.name,
          activationCondition: new HealthThresholdCondition(
            (skillData.activationCondition.operator as 'below' | 'above') ??
              'below',
            threshold,
          ),
          duration: skillData.duration,
          alterations: (skillData.statAlterations ?? []).map(
            (a) =>
              new Alteration(
                this.mapAlterationType(a.type),
                a.rate,
                a.duration,
                buildTargetingStrategy(a.targetingStrategy),
                undefined,
                undefined,
                a.terminationEvent,
                a.polarity,
              ),
          ),
          lifestealRate: skillData.lifestealRate,
          statusImmunity: skillData.statusImmunity,
          endCostRate: skillData.endCostRate,
        });
      }
      case SkillKind.SHIELD: {
        if (!skillData.activationCondition) {
          throw new Error('SHIELD skill requires activationCondition');
        }
        if (
          skillData.activationCondition.type !==
          AlterationConditionType.HEALTH_THRESHOLD
        ) {
          throw new Error(
            'SHIELD skill activationCondition must be of type health-threshold',
          );
        }
        if (
          !skillData.activationCondition.operator ||
          skillData.activationCondition.threshold === undefined
        ) {
          throw new Error(
            'SHIELD skill activationCondition requires operator and threshold',
          );
        }
        return new ShieldSkill(
          skillData.name,
          skillData.rate,
          this.buildSkillTargeting(skillData),
          new HealthThresholdCondition(
            skillData.activationCondition.operator as 'below' | 'above',
            skillData.activationCondition.threshold,
          ),
        );
      }
      case SkillKind.PROTECTION:
        if (!skillData.duration) {
          throw new BadRequestException('PROTECTION skill requires duration');
        }
        return new ProtectionSkill(
          skillData.name,
          skillData.duration,
          this.buildTriggerForSkill(skillData, ownerId),
          this.buildSkillTargeting(skillData),
          skillData.activationLimit,
          skillData.powerId,
        );
      case SkillKind.STANCE:
        return new StanceSkill(
          skillData.name,
          skillData.stanceActivation,
          this.buildTriggerForSkill(skillData, ownerId),
          skillData.powerId,
        );
      case SkillKind.CONCEALMENT:
        try {
          return new ConcealmentSkill(
            skillData.name,
            this.buildTriggerForSkill(skillData, ownerId),
            skillData.duration,
            skillData.powerId,
            skillData.stanceActivation,
            this.buildCooldown(skillData.interval),
            skillData.requiresUndamaged,
          );
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
      case SkillKind.BLEED_DETONATION:
        return new BleedExplosionSkill(
          skillData.name,
          skillData.rate,
          this.buildTriggerForSkill(skillData, ownerId),
          skillData.requiresStance,
        );
      case SkillKind.SURVIVE:
        throw new Error('SURVIVE skill must not appear in others skill list');
      case SkillKind.DAMAGE_REDUCTION:
      case SkillKind.DODGE_BONUS_DENIAL:
      case SkillKind.BLEED_STACK_SCALING:
      case SkillKind.BLEED_EMPOWERMENT:
      case SkillKind.LOW_HEALTH_TARGET_BONUS:
        throw new Error(
          `${skillData.kind} skill must not appear in others skill list`,
        );
      default:
        throw new Error(`Unknown skill kind: ${skillData.kind}`);
    }
  }

  private requireAllyHealthBelowFields(skillData: OtherSkillDto): void {
    if (!skillData.activationCondition) {
      throw new BadRequestException(
        `${skillData.kind} with ally-health-below requires activationCondition`,
      );
    }
    if (!skillData.targetCardId) {
      throw new BadRequestException(
        `${skillData.kind} with ally-health-below requires targetCardId`,
      );
    }
  }

  private mapAlterationType(
    buffType: BuffType,
  ): import('../core/cards/@types/alteration/alteration-type').AlterationType {
    const BUFF_TYPE_MAP = {
      [BuffType.ATTACK]: 'attack' as const,
      [BuffType.DEFENSE]: 'defense' as const,
      [BuffType.AGILITY]: 'agility' as const,
      [BuffType.ACCURACY]: 'accuracy' as const,
      [BuffType.SPEED]: 'speed' as const,
      [BuffType.CRITICAL_CHANCE]: 'criticalChance' as const,
      [BuffType.REGENERATION]: 'regeneration' as const,
      [BuffType.RESISTANCE]: 'resistance' as const,
    };

    const result = BUFF_TYPE_MAP[buffType];
    if (!result) throw new Error(`Unknown buff type: ${buffType}`);
    return result;
  }

  private getSelectorStrategy(
    cardSelectorStrategy: CardSelectorStrategy,
    player1: Player,
    player2: Player,
  ): CardSelector {
    const STRATEGY_MAP = {
      [CardSelectorStrategy.PLAYER_BY_PLAYER]: new PlayerByPlayerCardSelector(
        player1,
        player2,
      ),
      [CardSelectorStrategy.SPEED_WEIGHTED]: new SpeedWeightedCardSelector(
        player1,
        player2,
      ),
    };

    const result = STRATEGY_MAP[cardSelectorStrategy];
    if (!result)
      throw new Error(
        `Unknown card selector strategy: ${cardSelectorStrategy}`,
      );
    return result;
  }
}
