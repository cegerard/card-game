import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';
import {
  DamageTypeBonus,
  applyDamageBonuses,
} from '../@types/attack/damage-type-bonus';
import { BleedDetonation } from '../@types/attack/bleed-detonation';
import {
  nonEmpty,
  penetrationAgainst,
} from '../@types/weak-point/weak-point-strike';

export class SimpleAttack implements AttackSkill {
  constructor(
    public readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly effects?: AttackEffect[],
    private readonly damageBonuses: DamageTypeBonus[] = [],
    private readonly defensePenetration?: number,
    private readonly bleedDetonation?: BleedDetonation,
    private readonly weakPointPenetration?: number,
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
    const criticalRoll = Math.random();
    const defensiveCards = targeting.targetedCards(
      card,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const kind = this.bleedDetonation
      ? [this.bleedDetonation.damageType]
      : this.damages.map((d) => d.type);
    return {
      name: this.name,
      results: defensiveCards.map((target) => {
        // A guardian standing in front answers with its own dodge, defence
        // and element, so the swap happens before anything is rolled.
        const protector = context.opponentPlayer.protectorOf(target, card);
        const defender = protector ?? target;
        const interceptedFor = protector ? target : undefined;
        const isCritical = criticalRoll < card.criticalChanceAgainst(defender);
        const damageMultiplier = isCritical ? card.criticalMultiplier(2) : 1;

        if (defender.dodge(card)) {
          return {
            damage: 0,
            isCritical,
            dodge: true,
            defender,
            interceptedFor,
            kind,
            remainingHealth: defender.actualHealth,
            effects: nonEmpty(defender.strikeWeakPoints(context, false)),
          };
        }

        const detonation = this.bleedDetonation?.detonate(defender);
        const { total } = DamageCalculator.calculateDamage(
          detonation?.damages ?? this.damagesAgainst(card, defender),
          card.attackPower(context, defender) * damageMultiplier,
          defender,
          penetrationAgainst(
            defender,
            this.defensePenetration,
            this.weakPointPenetration,
          ),
        );
        const finalResult = defender.applyFinalDamage(
          defender.exposedDamage(total, card),
        );
        const weakPointEffects = defender.strikeWeakPoints(context, true);
        const { damageToHealth, shieldAbsorbed } = finalResult;

        const effects = [
          ...weakPointEffects,
          ...(this.effects ?? [])
            .map((e) => e.applyEffect(defender, card, context))
            .filter((r): r is EffectResult => r != null),
        ];

        return {
          damage: damageToHealth + shieldAbsorbed,
          shieldAbsorbed: shieldAbsorbed > 0 ? shieldAbsorbed : undefined,
          shieldBroken:
            shieldAbsorbed > 0 && !defender.shielded ? true : undefined,
          isCritical,
          dodge: false,
          defender,
          interceptedFor,
          effects: nonEmpty(effects),
          kind,
          remainingHealth: defender.actualHealth,
          survived: finalResult.survived,
          survivedSkillName: finalResult.survivedSkillName,
          mitigated: finalResult.mitigated,
          mitigatedSkillName: finalResult.mitigatedSkillName,
          consumedBleedStacks: detonation?.consumedStacks,
        };
      }),
    };
  }

  private damagesAgainst(
    attacker: FightingCard,
    defender: FightingCard,
  ): DamageComposition[] {
    return applyDamageBonuses(
      this.damageBonuses,
      this.damages,
      attacker,
      defender,
    );
  }
}
