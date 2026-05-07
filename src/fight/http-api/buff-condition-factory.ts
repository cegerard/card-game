import { BuffConditionType } from './dto/fight-data.dto';
import { AlterationCondition } from '../core/cards/@types/alteration/alteration-condition';
import { AllyPresenceCondition } from '../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../core/cards/@types/alteration/conditions/health-threshold-condition';

export function buildBuffCondition(
  type: BuffConditionType,
  params: { allyName?: string; threshold?: number; operator?: string },
): AlterationCondition {
  switch (type) {
    case BuffConditionType.ALLY_PRESENCE:
      if (!params.allyName) {
        throw new Error('AllyPresenceCondition requires allyName');
      }
      return new AllyPresenceCondition(params.allyName);
    case BuffConditionType.HEALTH_THRESHOLD: {
      const validOperators = ['above', 'below'] as const;
      if (
        params.operator !== undefined &&
        !validOperators.includes(params.operator as 'above' | 'below')
      ) {
        throw new Error(`Invalid operator: ${params.operator}`);
      }
      return new HealthThresholdCondition(
        params.threshold ?? 0.5,
        (params.operator as 'above' | 'below') ?? 'above',
      );
    }
    default:
      throw new Error(`Unknown BuffConditionType: ${type}`);
  }
}
