import { AlterationConditionType } from './dto/fight-data.dto';
import { AlterationCondition } from '../core/cards/@types/alteration/alteration-condition';
import { AllyPresenceCondition } from '../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../core/cards/@types/alteration/conditions/health-threshold-condition';
import { ProbabilityCondition } from '../core/cards/@types/alteration/conditions/probability-condition';
import { Randomizer } from '../core/randomizer';
import { MathRandomizer } from '../tools/math-randomizer';

type ConditionOperator = 'above' | 'below';
const VALID_OPERATORS: ConditionOperator[] = ['above', 'below'];

export function buildAlterationCondition(
  type: AlterationConditionType,
  params: {
    allyName?: string;
    threshold?: number;
    operator?: string;
    probability?: number;
  },
  randomizer: Randomizer = new MathRandomizer(),
): AlterationCondition {
  switch (type) {
    case AlterationConditionType.ALLY_PRESENCE:
      if (!params.allyName) {
        throw new Error('AllyPresenceCondition requires allyName');
      }
      return new AllyPresenceCondition(params.allyName);
    case AlterationConditionType.HEALTH_THRESHOLD: {
      if (
        params.operator !== undefined &&
        !VALID_OPERATORS.includes(params.operator as ConditionOperator)
      ) {
        throw new Error(`Invalid operator: ${params.operator}`);
      }
      return new HealthThresholdCondition(
        params.threshold ?? 0.5,
        (params.operator as ConditionOperator) ?? 'above',
      );
    }
    case AlterationConditionType.PROBABILITY:
      if (params.probability === undefined) {
        throw new Error('ProbabilityCondition requires probability');
      }
      return new ProbabilityCondition(params.probability, randomizer);
    default:
      throw new Error(`Unknown AlterationConditionType: ${type}`);
  }
}
