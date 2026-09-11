import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { HealthThresholdCondition } from '../@types/skill-activation-conditions/health-threshold-condition';
import { Alteration } from '../@types/alteration/alteration';
import { BuffResult } from '../@types/action-result/alteration-result';
import { HealthReactiveSkill } from './reactive-skill';
import { SkillKind, TransformationSkillResults } from './skill';

export type TransformationConfig = {
  name: string;
  activationCondition: HealthThresholdCondition;
  duration: number;
  alterations?: Alteration[];
  lifestealRate?: number;
  statusImmunity?: boolean;
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
    source.startTransformation(this.name, this.config.duration);

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
      (alteration) => alteration.apply(source, context) as BuffResult[],
    );

    return {
      skillKind: SkillKind.Transformation,
      results,
      name: this.name,
      remainingTurns: this.config.duration,
    };
  }

  isTriggered(_triggerName: string): boolean {
    return false;
  }
}
