import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { HealthThresholdCondition } from '../@types/skill-activation-conditions/health-threshold-condition';
import { Alteration } from '../@types/alteration/alteration';
import {
  BuffResult,
  DebuffResult,
} from '../@types/action-result/alteration-result';
import { HealthReactiveSkill } from './reactive-skill';
import { SkillKind, TransformationSkillResults } from './skill';
import { StanceActivation } from '../@types/stance/stance';

export type TransformationConfig = {
  name: string;
  activationCondition: HealthThresholdCondition;
  duration: number;
  alterations?: Alteration[];
  lifestealRate?: number;
  statusImmunity?: boolean;
  endCostRate?: number;
  /** Stances opened on the owner for their own durations. */
  stanceActivations?: StanceActivation[];
  /** Raises every stacked poison on the board and multiplies its damage. */
  poisonSurge?: { stacks: number; damageMultiplier: number };
};

/**
 * One-shot health-reactive transformation: when the card health ratio crosses
 * the activation threshold, it applies its alterations and turns on the
 * transformation perks for a number of turns. Never fires twice in a fight.
 */
export class TransformationSkill implements HealthReactiveSkill {
  public readonly id = 'transformation-skill';
  public readonly name: string;
  public readonly isHealthReactive = true as const;
  private consumed = false;

  constructor(private readonly config: TransformationConfig) {
    this.name = config.name;
  }

  onHealthChanged(card: FightingCard): boolean {
    if (this.consumed) return false;

    return this.config.activationCondition.evaluate(card);
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): TransformationSkillResults {
    this.consumed = true;
    source.startTransformation(
      this.name,
      this.config.duration,
      this.config.endCostRate,
    );

    if (this.config.lifestealRate) {
      source.applyLifesteal(
        this.name,
        this.config.lifestealRate,
        this.config.duration,
      );
    }

    if (this.config.statusImmunity) {
      source.applyStatusImmunity(this.config.duration);
    }

    const results = (this.config.alterations ?? []).flatMap(
      (alteration) =>
        alteration.apply(source, context) as (BuffResult | DebuffResult)[],
    );

    const stancesStarted = (this.config.stanceActivations ?? []).map(
      (activation) => source.activateStance(activation),
    );

    return {
      skillKind: SkillKind.Transformation,
      results,
      stancesStarted,
      poisonSurged: this.surgePoisons(context),
      name: this.name,
      remainingTurns: this.config.duration,
    };
  }

  isTriggered(_triggerName: string): boolean {
    return false;
  }

  private surgePoisons(context: FightingContext): FightingCard[] {
    const surge = this.config.poisonSurge;
    if (!surge) return [];

    return [
      ...context.sourcePlayer.playableCards,
      ...context.opponentPlayer.playableCards,
    ].filter((card) => card.surgePoison(surge.stacks, surge.damageMultiplier));
  }
}
