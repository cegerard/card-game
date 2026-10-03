import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';
import { BleedStackBonus } from '../@types/attack/bleed-stack-bonus';

export class SimpleAttack implements AttackSkill {
  constructor(
    public readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effects?: AttackEffect[],
    private readonly bleedStackBonus?: BleedStackBonus,
    private readonly defensePenetration?: number,
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
      results: defensiveCards.map((target) => {
        // A guardian standing in front answers with its own dodge, defence
        // and element, so the swap happens before anything is rolled.
        const protector = context.opponentPlayer.protectorOf(target);
        const defender = protector ?? target;
        const interceptedFor = protector ? target : undefined;

        if (defender.dodge(card)) {
          return {
            damage: 0,
            isCritical,
            dodge: true,
            defender,
            interceptedFor,
            kind,
            remainingHealth: defender.actualHealth,
          };
        }

        const { total } = DamageCalculator.calculateDamage(
          this.damagesAgainst(defender),
          card.attackPower(context) * damageMultiplier,
          defender,
          this.defensePenetration,
        );
        const finalResult = defender.applyFinalDamage(total);
        const { damageToHealth, shieldAbsorbed } = finalResult;

        const effects = this.effects
          ?.map((e) => e.applyEffect(defender, card, context))
          .filter((r): r is EffectResult => r != null);

        return {
          damage: damageToHealth + shieldAbsorbed,
          shieldAbsorbed: shieldAbsorbed > 0 ? shieldAbsorbed : undefined,
          shieldBroken:
            shieldAbsorbed > 0 && !defender.shielded ? true : undefined,
          isCritical,
          dodge: false,
          defender,
          interceptedFor,
          effects: effects?.length ? effects : undefined,
          kind,
          remainingHealth: defender.actualHealth,
          survived: finalResult.survived,
          survivedSkillName: finalResult.survivedSkillName,
          mitigated: finalResult.mitigated,
          mitigatedSkillName: finalResult.mitigatedSkillName,
        };
      }),
    };
  }

  private damagesAgainst(defender: FightingCard): DamageComposition[] {
    return (
      this.bleedStackBonus?.applyTo(this.damages, defender) ?? this.damages
    );
  }
}
