import { TurnEnd } from '../core/trigger/turn-end';
import { TriggerEvent } from './dto/fight-data.dto';

const STRATEGY_MAP = {
  [TriggerEvent.TURN_END]: new TurnEnd(),
};

export function buildTriggerStrategy(triggerEvent: TriggerEvent) {
  return STRATEGY_MAP[triggerEvent];
}
