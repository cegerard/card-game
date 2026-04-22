import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';

export class SimpleAttack implements AttackSkill {
  constructor(
    public readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effect?: AttackEffect,
  ) {}

  public get targetingId(): string {
    return this.targetingStrategy.id;
  }

  public launch(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): NamedAttackResult {
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
  ): NamedAttackResult {
    const isCritical = Math.random() < card.actualCriticalChance;
    const damageMultiplier = isCritical ? 2 : 1;
    const defensiveCards = targeting.targetedCards(
      card,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const kind = this.damages.map((d) => d.type);
    return {
      name: this.name,
      results: defensiveCards.map((defender) => {
        if (defender.dodge(card.actualAccuracy)) {
          return { damage: 0, isCritical, dodge: true, defender, kind };
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
          kind,
        };
      }),
    };
  }
}
