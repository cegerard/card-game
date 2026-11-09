import { DamageComposition } from '../@types/damage/damage-composition';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { AttackResult } from '../@types/action-result/attack-result';
import {
  AttackEffect,
  EffectResult,
  nonEmpty,
} from '../@types/attack/attack-effect';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { DamageCalculator } from '../damage/damage-calculator';
import { AttackSkill } from './attack-skill';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';
import {
  DamageTypeBonus,
  applyDamageBonuses,
} from '../@types/attack/damage-type-bonus';
import { penetrationAgainst } from '../@types/weak-point/weak-point-strike';

export class MultipleAttack implements AttackSkill {
  constructor(
    public readonly name: string,
    private readonly hits: number,
    private readonly damages: DamageComposition[],
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly amplifier: number = 0,
    private readonly effects?: AttackEffect[],
    private readonly comboFinisher?: DamageComposition[],
    private readonly comboFinisherEffects?: AttackEffect[],
    private readonly damageBonuses: DamageTypeBonus[] = [],
    private readonly defensePenetration?: number,
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
    const results: NamedAttackResult = {
      name: this.name,
      results: [] as AttackResult[],
    };
    const hitTargets = new Set<FightingCard>();
    const dodgedTargets = new Set<FightingCard>();
    const kind = this.damages.map((d) => d.type);

    for (let i = 0; i < this.hits; i++) {
      // Read once: the stacks this hit lays must not raise its next defenders.
      const attackPower = card.attackPower(context) * (1 + this.amplifier * i);
      const targets = targeting.targetedCards(
        card,
        context.sourcePlayer,
        context.opponentPlayer,
      );

      for (const target of targets) {
        if (target.isDead()) continue;

        // A guardian standing in front answers with its own dodge, defence
        // and element, so the swap happens before anything is rolled.
        const protector = context.opponentPlayer.protectorOf(target, card);
        const defender = protector ?? target;
        const interceptedFor = protector ? target : undefined;

        hitTargets.add(defender);
        const isCritical = Math.random() < card.criticalChanceAgainst(defender);
        const damageMultiplier = isCritical ? card.criticalMultiplier(2) : 1;

        if (defender.dodge(card)) {
          dodgedTargets.add(defender);
          results.results.push({
            damage: 0,
            isCritical,
            dodge: true,
            defender,
            interceptedFor,
            remainingHealth: defender.actualHealth,
            kind,
            effects: nonEmpty(defender.strikeWeakPoints(context, false)),
          });
          continue;
        }

        const { total } = DamageCalculator.calculateDamage(
          this.withBonus(this.damages, card, defender),
          attackPower * card.targetBonusAgainst(defender) * damageMultiplier,
          defender,
          this.defensePenetrationAgainst(defender),
        );
        const finalResult = defender.applyFinalDamage(
          defender.exposedDamage(total, card),
        );
        const { damageToHealth, shieldAbsorbed } = finalResult;

        const effects = [
          ...defender.strikeWeakPoints(context, true),
          ...(this.effects ?? [])
            .map((e) => e.applyEffect(defender, card, context))
            .filter((r): r is EffectResult => r != null),
        ];

        results.results.push({
          damage: damageToHealth + shieldAbsorbed,
          shieldAbsorbed: shieldAbsorbed > 0 ? shieldAbsorbed : undefined,
          shieldBroken:
            shieldAbsorbed > 0 && !defender.shielded ? true : undefined,
          isCritical,
          dodge: false,
          defender,
          interceptedFor,
          remainingHealth: defender.actualHealth,
          effects: nonEmpty(effects),
          kind,
          survived: finalResult.survived,
          survivedSkillName: finalResult.survivedSkillName,
          mitigated: finalResult.mitigated,
          mitigatedSkillName: finalResult.mitigatedSkillName,
          damageShared: finalResult.damageShared,
        });
      }
    }

    if (this.comboFinisher) {
      const finisherKind = this.comboFinisher.map((d) => d.type);
      for (const defender of hitTargets) {
        if (dodgedTargets.has(defender) || defender.isDead()) continue;

        const { total } = DamageCalculator.calculateDamage(
          this.withBonus(this.comboFinisher, card, defender),
          card.attackPower(context, defender),
          defender,
          this.defensePenetrationAgainst(defender),
        );
        const finisherResult = defender.applyFinalDamage(
          defender.exposedDamage(total, card),
        );
        const { damageToHealth, shieldAbsorbed } = finisherResult;

        const finisherEffects = [
          ...defender.strikeWeakPoints(context, true),
          ...(this.comboFinisherEffects ?? [])
            .map((e) => e.applyEffect(defender, card, context))
            .filter((r): r is EffectResult => r != null),
        ];

        results.results.push({
          damage: damageToHealth + shieldAbsorbed,
          shieldAbsorbed: shieldAbsorbed > 0 ? shieldAbsorbed : undefined,
          shieldBroken:
            shieldAbsorbed > 0 && !defender.shielded ? true : undefined,
          isCritical: false,
          dodge: false,
          defender,
          remainingHealth: defender.actualHealth,
          effects: nonEmpty(finisherEffects),
          kind: finisherKind,
          survived: finisherResult.survived,
          survivedSkillName: finisherResult.survivedSkillName,
          mitigated: finisherResult.mitigated,
          mitigatedSkillName: finisherResult.mitigatedSkillName,
          damageShared: finisherResult.damageShared,
        });
      }
    }

    return results;
  }

  private defensePenetrationAgainst(
    defender: FightingCard,
  ): number | undefined {
    return penetrationAgainst(
      defender,
      this.defensePenetration,
      this.weakPointPenetration,
    );
  }

  private withBonus(
    damages: DamageComposition[],
    attacker: FightingCard,
    defender: FightingCard,
  ): DamageComposition[] {
    return applyDamageBonuses(this.damageBonuses, damages, attacker, defender);
  }
}
