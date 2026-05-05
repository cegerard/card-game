import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
import { FightingCard } from '../fighting-card';
import { Special } from './special';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { BuffApplication } from '../@types/alteration/alteration';
import { DamageComposition } from '../@types/damage/damage-composition';
import { DamageCalculator } from '../damage/damage-calculator';

const ENERGY_INCREASE_FACTOR = 10;
const CRITICAL_RATE = 1.3;

export class SpecialAttack implements Special {
  constructor(
    readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effect?: AttackEffect,
    private readonly buffApplication?: BuffApplication[],
  ) {}

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
  }

  public launch(
    source: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): SpecialResult {
    const isCritical = Math.random() < source.actualCriticalChance;
    const damageMultiplier = isCritical ? CRITICAL_RATE : 1;
    const targeting =
      targetingStrategy && this.targetingStrategy.id === 'from-position'
        ? targetingStrategy
        : this.targetingStrategy;
    const targetedCards = targeting.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );
    const kind = this.damages.map((d) => d.type);

    const attackResults = targetedCards.map((target) => {
      if (target.dodge(source.actualAccuracy)) {
        return { damage: 0, isCritical, dodge: true, defender: target, kind };
      }

      const { total } = DamageCalculator.calculateDamage(
        this.damages,
        source.actualAttack * damageMultiplier,
        target,
      );
      const damage = target.applyFinalDamage(total);

      let effectResult: EffectResult;
      if (this.effect) {
        effectResult = this.effect.applyEffect(target, source, context);
      }

      return {
        damage,
        isCritical,
        dodge: false,
        defender: target,
        kind,
        effects: effectResult ? [effectResult] : undefined,
      };
    });

    const buffResults = this.applyBuffs(source, context);

    return {
      name: this.name,
      actionResults: attackResults,
      buffResults,
    };
  }

  public increaseEnergy(actualEnergy: number): number {
    return Math.min(actualEnergy + ENERGY_INCREASE_FACTOR, this.energyNeeded);
  }

  public getSpecialKind(): string {
    return 'specialAttack';
  }

  private applyBuffs(source: FightingCard, context: FightingContext) {
    if (!this.buffApplication) {
      return [];
    }

    return this.buffApplication.flatMap((buff) =>
      buff.applyBuff(source, context),
    );
  }
}
