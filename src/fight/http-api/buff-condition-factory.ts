import { BuffConditionType } from './dto/fight-data.dto';
import { ConditionedAlteration } from '../core/cards/@types/alteration/conditioned-alteration';
import { AllyPresenceCondition } from '../core/cards/@types/alteration/conditions/ally-presence-condition';
import { HealthThresholdCondition } from '../core/cards/@types/alteration/conditions/health-threshold-condition';

export function buildBuffCondition(
  type: BuffConditionType,
  params: { allyName?: string; threshold?: number; operator?: string },
): ConditionedAlteration {
  switch (type) {
    case BuffConditionType.ALLY_PRESENCE:
      if (!params.allyName) {
        throw new Error('AllyPresenceCondition requires allyName');
      }
      return new AllyPresenceCondition(params.allyName);
    case BuffConditionType.HEALTH_THRESHOLD:
      return new HealthThresholdCondition(
        params.threshold ?? 0.5,
        (params.operator as 'above' | 'below') ?? 'above',
      );
  }
}
