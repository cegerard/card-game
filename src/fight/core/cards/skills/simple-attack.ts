import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from '../@types/action-result/attack-result';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';

export class SimpleAttack implements AttackSkill {
  constructor(
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effect?: AttackEffect,
  ) {}

  public get targetingId(): string {
    return this.targetingStrategy.id;
  }

  public launch(card: FightingCard, context: FightingContext): AttackResult[] {
    return this.launchWithTargeting(card, context, this.targetingStrategy);
  }

  public launchWithTargeting(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy: TargetingCardStrategy,
  ): AttackResult[] {
    return this.executeAttack(card, context, targetingStrategy);
  }

  private executeAttack(
    card: FightingCard,
    context: FightingContext,
    targeting: TargetingCardStrategy,
  ): AttackResult[] {
    const isCritical = Math.random() < card.actualCriticalChance;
    const damageMultiplier = isCritical ? 2 : 1;
    const defensiveCards = targeting.targetedCards(
      card,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return defensiveCards.map((defender) => {
      if (defender.dodge(card.actualAccuracy)) {
        return { damage: 0, isCritical, dodge: true, defender: defender };
      }

      const { total } = DamageCalculator.calculateDamage(
        this.damages,
        card.actualAttack * damageMultiplier,
        defender,
      );
      const collectedDamage = defender.applyFinalDamage(total);

      let effectResult: EffectResult;
      if (this.effect) {
        effectResult = this.effect.applyEffect(defender, card, context);
      }

      return {
        damage: collectedDamage,
        isCritical,
        dodge: false,
        defender,
        effect: effectResult,
      };
    });
  }
}
