import { FightingCard } from '../fighting-card';
import { FightingContext } from '../@types/fighting-context';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { HealthThresholdCondition } from '../@types/skill-activation-conditions/health-threshold-condition';
import { HealthReactiveSkill } from './reactive-skill';
import { SkillKind, SkillResults } from './skill';

export class ShieldSkill implements HealthReactiveSkill {
  public readonly id = 'shield-skill';
  public readonly name: string;
  public readonly isHealthReactive = true as const;
  private wasAboveThreshold = true;

  constructor(
    name: string,
    private readonly rate: number,
    private readonly targetingStrategy: TargetingCardStrategy,
    private readonly activationCondition: HealthThresholdCondition,
  ) {
    this.name = name;
  }

  onHealthChanged(card: FightingCard): boolean {
    const nowBelow = this.activationCondition.evaluate(card);

    if (this.wasAboveThreshold && nowBelow) {
      this.wasAboveThreshold = false;
      return true;
    }

    if (!nowBelow) {
      this.wasAboveThreshold = true;
    }

    return false;
  }

  launch(
    source: FightingCard,
    context: FightingContext,
    _targetingOverride?: TargetingCardStrategy,
  ): SkillResults {
    const targets = this.targetingStrategy.targetedCards(
      source,
      context.sourcePlayer,
      context.opponentPlayer,
    );

    const results = targets.map((target) => {
      const shield = target.applyShield(this.rate, Infinity);
      return { target: target.identityInfo, shield };
    });

    return {
      skillKind: SkillKind.Shield,
      results,
      name: this.name,
    };
  }

  isTriggered(_triggerName: string): boolean {
    return false;
  }
}
