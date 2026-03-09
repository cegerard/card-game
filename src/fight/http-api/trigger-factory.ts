import { TurnEnd } from '../core/trigger/turn-end';
import { NextAction } from '../core/trigger/next-action';
import { TriggerEvent } from './dto/fight-data.dto';

const STRATEGY_MAP = {
  [TriggerEvent.TURN_END]: new TurnEnd(),
  [TriggerEvent.NEXT_ACTION]: new NextAction(),
};

export function buildTriggerStrategy(triggerEvent: TriggerEvent) {
  return STRATEGY_MAP[triggerEvent];
}
