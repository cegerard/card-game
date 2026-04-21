import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from '../@types/action-result/attack-result';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';

export class MultipleAttack implements AttackSkill {
  constructor(
    private readonly _name: string,
    private readonly hits: number,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly amplifier: number = 0,
    private readonly effect?: AttackEffect,
    private readonly comboFinisher?: DamageComposition[],
  ) {}

  public get name(): string {
    return this._name;
  }

  public get targetingId(): string {
    return this.targetingStrategy.id;
  }

  public launch(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): AttackResult[] {
    const targeting =
      targetingStrategy && this.targetingStrategy.id === 'from-position'
        ? targetingStrategy
        : this.targetingStrategy;
    return this.executeAttack(card, context, targeting);
  }

  private executeAttack(
    card: FightingCard,
    context: FightingContext,
    targeting: TargetingCardStrategy,
  ): AttackResult[] {
    const results: AttackResult[] = [];
    const hitTargets = new Set<FightingCard>();
    const dodgedTargets = new Set<FightingCard>();

    for (let i = 0; i < this.hits; i++) {
      const attackPower = card.actualAttack * (1 + this.amplifier * i);
      const targets = targeting.targetedCards(
        card,
        context.sourcePlayer,
        context.opponentPlayer,
      );

      for (const defender of targets) {
        if (defender.isDead()) continue;

        hitTargets.add(defender);
        const isCritical = Math.random() < card.actualCriticalChance;
        const damageMultiplier = isCritical ? 2 : 1;

        if (defender.dodge(card.actualAccuracy)) {
          dodgedTargets.add(defender);
          results.push({
            damage: 0,
            isCritical,
            dodge: true,
            defender,
            remainingHealth: defender.actualHealth,
          });
          continue;
        }

        const { total } = DamageCalculator.calculateDamage(
          this.damages,
          attackPower * damageMultiplier,
          defender,
        );
        const collectedDamage = defender.applyFinalDamage(total);

        let effectResult: EffectResult;
        if (this.effect) {
          effectResult = this.effect.applyEffect(defender, card, context);
        }

        results.push({
          damage: collectedDamage,
          isCritical,
          dodge: false,
          defender,
          remainingHealth: defender.actualHealth,
          effect: effectResult,
        });
      }
    }

    if (this.comboFinisher) {
      for (const defender of hitTargets) {
        if (dodgedTargets.has(defender) || defender.isDead()) continue;

        const { total } = DamageCalculator.calculateDamage(
          this.comboFinisher,
          card.actualAttack,
          defender,
        );
        const collectedDamage = defender.applyFinalDamage(total);
        results.push({
          damage: collectedDamage,
          isCritical: false,
          dodge: false,
          defender,
          remainingHealth: defender.actualHealth,
        });
      }
    }

    return results;
  }
}
