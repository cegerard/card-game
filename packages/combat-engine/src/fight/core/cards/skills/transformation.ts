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
import { Trigger } from '../../trigger/trigger';
import { TRANSFORMED } from '../../trigger/transformed';

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
  /** An event that also sets it off, once per fight like the threshold. */
  activationTrigger?: Trigger;
  /** Multiplies what a critical hit of the owner deals by `1 + rate`. */
  criticalDamageRate?: number;
};

/**
 * One-shot health-reactive transformation: when the card health ratio crosses
 * the activation threshold, or its activation event fires, it applies its
 * alterations and turns on the transformation perks for a number of turns.
 * Never fires twice in a fight. Once started, the owner hears `transformed`.
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
      this.config.criticalDamageRate,
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
    const poisonSurged = this.surgePoisons(context);
    const followUps = source.launchSkills(TRANSFORMED, context);

    return {
      skillKind: SkillKind.Transformation,
      results,
      stancesStarted,
      poisonSurged,
      name: this.name,
      remainingTurns: this.config.duration,
      followUps: followUps.length > 0 ? followUps : undefined,
    };
  }

  isTriggered(triggerName: string): boolean {
    return (
      !this.consumed &&
      (this.config.activationTrigger?.isTriggered(triggerName) ?? false)
    );
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
