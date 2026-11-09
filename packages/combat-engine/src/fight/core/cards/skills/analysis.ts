import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { AttackEffect, EffectResult } from '../@types/attack/attack-effect';
import { Trigger } from '../../trigger/trigger';
import { ENEMIES_ANALYSED } from '../../trigger/enemies-analysed';
import { AnalysisSkillResults, Skill, SkillKind } from './skill';

/**
 * Lays one charge on the enemy that just attacked (`lastAttacker`), up to
 * `maxCharges` per enemy. The charge that fills an enemy lays the weak point
 * effect on it, its owner being the revealer. Once every living enemy is
 * full, the owner hears `enemies-analysed`.
 */
export class AnalysisSkill implements Skill {
  public readonly id = 'analysis';
  private readonly charges = new Map<FightingCard, number>();

  constructor(
    public readonly name: string,
    private readonly maxCharges: number,
    private readonly weakPointEffect: AttackEffect,
    private readonly trigger: Trigger,
  ) {
    if (!Number.isInteger(maxCharges) || maxCharges < 1) {
      throw new Error(
        `AnalysisSkill maxCharges must be an integer greater than or equal to 1, got ${maxCharges}`,
      );
    }
  }

  launch(source: FightingCard, context: FightingContext): AnalysisSkillResults {
    const enemy = context.lastAttacker;
    if (!enemy || enemy.isDead() || this.isFull(enemy)) {
      return this.results([], []);
    }

    const charges = this.chargesOn(enemy) + 1;
    this.charges.set(enemy, charges);
    if (!this.isFull(enemy)) return this.results([{ target: enemy, charges }]);

    const revealed = [
      this.weakPointEffect.applyEffect(enemy, source, context),
    ].filter((result): result is EffectResult => result != null);
    const everyEnemyFull = context.opponentPlayer.playableCards.every((card) =>
      this.isFull(card),
    );

    return {
      ...this.results([{ target: enemy, charges }], revealed),
      followUps: everyEnemyFull
        ? source.launchSkills(ENEMIES_ANALYSED, context)
        : undefined,
    };
  }

  isTriggered(triggerName: string): boolean {
    return this.trigger.isTriggered(triggerName);
  }

  private chargesOn(enemy: FightingCard): number {
    return this.charges.get(enemy) ?? 0;
  }

  private isFull(enemy: FightingCard): boolean {
    return this.chargesOn(enemy) >= this.maxCharges;
  }

  private results(
    results: AnalysisSkillResults['results'],
    revealed: EffectResult[] = [],
  ): AnalysisSkillResults {
    return {
      skillKind: SkillKind.Analysis,
      name: this.name,
      results,
      revealed,
    };
  }
}
