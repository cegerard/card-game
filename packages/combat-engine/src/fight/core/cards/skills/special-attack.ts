import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
import { FightingCard } from '../fighting-card';
import { Special } from './special';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { Alteration } from '../@types/alteration/alteration';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageCalculator } from '../damage/damage-calculator';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { ShieldApplication } from '../@types/shield/shield-application';
import { ShieldResult } from '../@types/action-result/shield-result';
import { MarkedTargetBonus } from '../@types/mark/marked-target-bonus';
import { Stance, StanceActivation } from '../@types/stance/stance';
import { AttackResult } from '../@types/action-result/attack-result';
import { BleedStackBonus } from '../@types/attack/bleed-stack-bonus';
import { EnergyRefund } from '../@types/attack/energy-refund';

const ENERGY_INCREASE_FACTOR = 10;
const CRITICAL_RATE = 1.3;

export class SpecialAttack implements Special {
  constructor(
    readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effect?: AttackEffect,
    private readonly alterations?: Alteration[],
    private readonly shieldApplication?: ShieldApplication,
    private readonly markedTargetBonus?: MarkedTargetBonus,
    private readonly stanceActivation?: StanceActivation,
    private readonly hits: number = 1,
    private readonly bleedStackBonus?: BleedStackBonus,
    private readonly energyRefund?: EnergyRefund,
  ) {
    if (hits < 1) {
      throw new Error(
        `SpecialAttack hits must be greater than or equal to 1, got ${hits}`,
      );
    }
  }

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
  }

  public launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult {
    const targeting =
      targetingStrategy && this.targetingStrategy.id === 'from-position'
        ? targetingStrategy
        : this.targetingStrategy;
    const attackResults: AttackResult[] = [];

    for (let hit = 0; hit < this.hits; hit++) {
      const isCritical = Math.random() < source.actualCriticalChance;
      const targetedCards = targeting
        .targetedCards(source, context.sourcePlayer, context.opponentPlayer)
        .filter((card) => !card.isDead());

      attackResults.push(
        ...targetedCards.map((aimedAt) =>
          this.strike(source, aimedAt, context, isCritical),
        ),
      );
    }

    const alterationResults = this.applyAlterations(source, context);
    const shieldResults = this.applyShield(source, context);

    return {
      name: this.name,
      actionResults: attackResults,
      alterationResults,
      shieldResults,
      stanceStarted: this.openStance(source),
      energyRefund: this.energyRefund?.amountFor(
        source,
        attackResults[0]?.defender,
      ),
    };
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialAttack';
  }

  private strike(
    source: FightingCard,
    aimedAt: FightingCard,
    context: FightingContext,
    isCritical: boolean,
  ): AttackResult {
    const damageMultiplier = isCritical ? CRITICAL_RATE : 1;
    const kind = this.damages.map((d) => d.type);
    // A guardian standing in front answers with its own dodge, defence and
    // element, so the swap happens before anything is rolled.
    const protector = context.opponentPlayer.protectorOf(aimedAt);
    const target = protector ?? aimedAt;
    const interceptedFor = protector ? aimedAt : undefined;

    if (target.dodge(source)) {
      return {
        damage: 0,
        isCritical,
        dodge: true,
        defender: target,
        interceptedFor,
        kind,
        remainingHealth: target.actualHealth,
      };
    }

    const markedBonus = this.markedTargetBonus?.multiplierFor(target) ?? 1;
    const damages =
      this.bleedStackBonus?.applyTo(this.damages, target) ?? this.damages;
    const { total } = DamageCalculator.calculateDamage(
      damages,
      source.actualAttack * damageMultiplier * markedBonus,
      target,
    );
    const finalResult = target.applyFinalDamage(total);
    const { damageToHealth, shieldAbsorbed } = finalResult;

    let effectResult: EffectResult;
    if (this.effect) {
      effectResult = this.effect.applyEffect(target, source, context);
    }

    return {
      damage: damageToHealth + shieldAbsorbed,
      shieldAbsorbed: shieldAbsorbed > 0 ? shieldAbsorbed : undefined,
      shieldBroken: shieldAbsorbed > 0 && !target.shielded ? true : undefined,
      isCritical,
      dodge: false,
      defender: target,
      interceptedFor,
      kind,
      remainingHealth: target.actualHealth,
      effects: effectResult ? [effectResult] : undefined,
      survived: finalResult.survived,
      survivedSkillName: finalResult.survivedSkillName,
      mitigated: finalResult.mitigated,
      mitigatedSkillName: finalResult.mitigatedSkillName,
    };
  }

  private applyAlterations(
    source: FightingCard,
    context: FightingContext,
  ): (BuffResult | DebuffResult)[] {
    if (!this.alterations) {
      return [];
    }

    return this.alterations.flatMap(
      (alteration) =>
        alteration.apply(source, context) as (BuffResult | DebuffResult)[],
    );
  }

  private openStance(source: FightingCard): Stance | undefined {
    if (!this.stanceActivation) return undefined;

    return source.activateStance(
      this.stanceActivation.name,
      this.stanceActivation.duration,
      this.stanceActivation.immunities,
    );
  }

  private applyShield(
    source: FightingCard,
    context: FightingContext,
  ): ShieldResult[] {
    if (!this.shieldApplication) {
      return [];
    }
    return this.shieldApplication.apply(source, context);
  }
}
