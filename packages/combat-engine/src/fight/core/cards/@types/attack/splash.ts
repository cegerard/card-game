import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';
import { DamageComposition } from '../damage/damage-composition';
import { AttackEffect } from './attack-effect';
import { NamedAttackResult } from '../action-result/named-attack-result';
import { SimpleAttack } from '../../skills/simple-attack';
import { TargetAndNeighborsStrategy } from '../../../targeting-card-strategies/target-and-neighbors';

/**
 * A secondary strike hitting the zone centered on the primary target — that
 * target and its two neighbors — with its own damages and effects. It runs
 * through the regular attack pipeline, so dodge, protection and shields apply.
 */
export class Splash {
  constructor(
    public readonly name: string,
    private readonly damages: DamageComposition[],
    private readonly effects?: AttackEffect[],
  ) {}

  public strike(
    source: FightingCard,
    center: FightingCard,
    context: FightingContext,
  ): NamedAttackResult {
    return new SimpleAttack(
      this.name,
      this.damages,
      new TargetAndNeighborsStrategy(center),
      this.effects,
    ).launch(source, context);
  }
}
