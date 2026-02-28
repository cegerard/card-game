import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { FightingContext } from '../@types/fighting-context';
import { SpecialResult } from '../@types/action-result/special-result';
import { FightingCard } from '../fighting-card';
import { Special } from './special';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { BuffApplication } from '../@types/buff/buff-application';

const ENERGY_INCREASE_FACTOR = 10;
const CRITICAL_RATE = 1.3;
const DEFAULT_DAMAGE_RATE = 1;

export class SpecialAttack implements Special {
  constructor(
    private readonly damageRate: number,
    private readonly energyNeeded: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effect?: AttackEffect,
    private readonly buffApplication?: BuffApplication[],
  ) {}

  public ready(actualEnergy: number): boolean {
    return actualEnergy >= this.energyNeeded;
  }

  public launch(source: FightingCard, context: FightingContext): SpecialResult {
    const isCritical = Math.random() < source.actualCriticalChance;
    const targetedCards = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const attackResults = targetedCards.map((target) => {
      if (target.dodge(source.actualAccuracy)) {
        return { damage: 0, isCritical, dodge: true, defender: target };
      }

      const computedDamage = this.computeDamage(
        source.actualAttack,
        isCritical,
      );
      const damage = target.collectsDamages(computedDamage);

      let effectResult: EffectResult;
      if (this.effect) {
        effectResult = this.effect.applyEffect(target, source, context);
      }

      return {
        damage,
        isCritical,
        dodge: false,
        defender: target,
        effect: effectResult,
      };
    });

    const buffResults = this.applyBuffs(source, context);

    return {
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

  private computeDamage(damage: number, isCritical: boolean): number {
    const damageMultiplier = isCritical ? CRITICAL_RATE : DEFAULT_DAMAGE_RATE;

    return Math.round(damage * this.damageRate * damageMultiplier);
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
