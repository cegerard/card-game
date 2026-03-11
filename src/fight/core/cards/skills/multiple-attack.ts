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
    private readonly hits: number,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly amplifier: number = 0,
    private readonly effect?: AttackEffect,
  ) {}

  public launch(card: FightingCard, context: FightingContext): AttackResult[] {
    const results: AttackResult[] = [];

    for (let i = 0; i < this.hits; i++) {
      const attackPower = card.actualAttack * (1 + this.amplifier * i);
      const targets = this.targetingStrategy.targetedCards(
        card,
        context.sourcePlayer,
        context.opponentPlayer,
      );

      for (const defender of targets) {
        if (defender.isDead()) continue;

        const isCritical = Math.random() < card.actualCriticalChance;
        const damageMultiplier = isCritical ? 2 : 1;

        if (defender.dodge(card.actualAccuracy)) {
          results.push({ damage: 0, isCritical, dodge: true, defender });
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
          effect: effectResult,
        });
      }
    }

    return results;
  }
}
