import { BuffConditionType } from './dto/fight-data.dto';
import { BuffCondition } from '../core/cards/@types/buff/buff-condition';
import { AllyPresenceCondition } from '../core/cards/@types/buff/conditions/ally-presence-condition';

export function buildBuffCondition(
  type: BuffConditionType,
  params: { allyName?: string },
): BuffCondition {
  switch (type) {
    case BuffConditionType.ALLY_PRESENCE:
      if (!params.allyName) {
        throw new Error('AllyPresenceCondition requires allyName');
      }
      return new AllyPresenceCondition(params.allyName);
  }
}
