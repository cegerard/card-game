import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from '../@types/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';

export class SimpleAttack {
  constructor(
    private readonly damageRate: number,
    private readonly targetingStrategy: TargetingCardStrategy,
  ) {}

  public launch(card: FightingCard, context: FightingContext): AttackResult[] {
    const isCritical = Math.random() < card.actualCriticalChance;
    const damageMultiplier = isCritical ? 2 : 1;
    const defensiveCards = this.targetingStrategy.targetedCards(
      card,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    return defensiveCards.map((defender) => {
      if (defender.dodge(card.actualAccuracy)) {
        return { damage: 0, isCritical, dodge: true, defender: defender };
      }

      const computedDamage = Math.round(
        card.actualAttack * this.damageRate * damageMultiplier,
      );
      const collectedDamage = defender.collectsDamages(computedDamage);

      return {
        damage: collectedDamage,
        isCritical,
        dodge: false,
        defender,
      };
    });
  }
}
