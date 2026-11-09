import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
import { FightingCard } from '../fighting-card';
import { BaseSpecial } from './special';
import {
  AttackEffect,
  EffectResult,
  nonEmpty,
} from '../@types/attack/attack-effect';
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
import {
  DamageTypeBonus,
  applyDamageBonuses,
} from '../@types/attack/damage-type-bonus';
import { EnergyRefund } from '../@types/attack/energy-refund';
import { Execution } from '../@types/attack/execution';

const CRITICAL_RATE = 1.3;

export class SpecialAttack extends BaseSpecial {
  private readonly effects: AttackEffect[];

  constructor(
    name: string,
    private readonly damages: DamageComposition[],
    energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    effects?: AttackEffect | AttackEffect[],
    private readonly alterations?: Alteration[],
    private readonly shieldApplication?: ShieldApplication,
    private readonly markedTargetBonus?: MarkedTargetBonus,
    private readonly stanceActivation?: StanceActivation,
    private readonly hits: number = 1,
    private readonly damageBonuses: DamageTypeBonus[] = [],
    private readonly energyRefund?: EnergyRefund,
    private readonly execution?: Execution,
    private readonly defensePenetration?: number,
    private readonly undodgeable = false,
  ) {
    super(name, energyNeeded);
    this.effects = [effects ?? []].flat();
    if (hits < 1) {
      throw new Error(
        `SpecialAttack hits must be greater than or equal to 1, got ${hits}`,
      );
    }
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
      const criticalRoll = Math.random();
      const targetedCards = targeting
        .targetedCards(source, context.sourcePlayer, context.opponentPlayer)
        .filter((card) => !card.isDead());

      attackResults.push(
        ...targetedCards.map((aimedAt) =>
          this.strike(source, aimedAt, context, criticalRoll),
        ),
      );
    }

    const executions = this.execution?.apply(attackResults) ?? [];
    const alterationResults = this.applyAlterations(source, context);
    const shieldResults = this.applyShield(source, context);

    return {
      name: this.name,
      actionResults: attackResults,
      alterationResults,
      shieldResults,
      executions,
      stanceStarted: this.openStance(source),
      energyRefund: this.energyRefund?.amountFor(
        source,
        attackResults[0]?.defender,
      ),
    };
  }

  public getSpecialKind(): string {
    return 'specialAttack';
  }

  private strike(
    source: FightingCard,
    aimedAt: FightingCard,
    context: FightingContext,
    criticalRoll: number,
  ): AttackResult {
    const kind = this.damages.map((d) => d.type);
    // A guardian standing in front answers with its own dodge, defence and
    // element, so the swap happens before anything is rolled.
    const protector = context.opponentPlayer.protectorOf(aimedAt, source);
    const target = protector ?? aimedAt;
    const interceptedFor = protector ? aimedAt : undefined;
    const isCritical = criticalRoll < source.criticalChanceAgainst(target);
    const damageMultiplier = isCritical
      ? source.criticalMultiplier(CRITICAL_RATE)
      : 1;

    if (!this.undodgeable && target.dodge(source)) {
      return {
        damage: 0,
        isCritical,
        dodge: true,
        defender: target,
        interceptedFor,
        kind,
        remainingHealth: target.actualHealth,
        effects: nonEmpty(target.strikeWeakPoints(context, false)),
      };
    }

    const markedBonus = this.markedTargetBonus?.multiplierFor(target) ?? 1;
    const damages = applyDamageBonuses(
      this.damageBonuses,
      this.damages,
      source,
      target,
    );
    const { total } = DamageCalculator.calculateDamage(
      damages,
      source.attackPower(context, target) * damageMultiplier * markedBonus,
      target,
      this.defensePenetration,
    );
    const finalResult = target.applyFinalDamage(
      target.exposedDamage(total, source),
    );
    const { damageToHealth, shieldAbsorbed } = finalResult;

    const effects = [
      ...target.strikeWeakPoints(context, true),
      ...this.effects
        .map((effect) => effect.applyEffect(target, source, context))
        .filter((r): r is EffectResult => r != null),
    ];

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
      effects: nonEmpty(effects),
      survived: finalResult.survived,
      survivedSkillName: finalResult.survivedSkillName,
      mitigated: finalResult.mitigated,
      mitigatedSkillName: finalResult.mitigatedSkillName,
      damageShared: finalResult.damageShared,
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

    return source.activateStance(this.stanceActivation);
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
