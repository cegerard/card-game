import { TurnEnd } from '../core/trigger/turn-end';
import { NextAction } from '../core/trigger/next-action';
import { AllyDeath } from '../core/trigger/ally-death';
import { Trigger } from '../core/trigger/trigger';
import { TriggerEvent } from './dto/fight-data.dto';

const STRATEGY_MAP: Record<string, Trigger> = {
  [TriggerEvent.TURN_END]: new TurnEnd(),
  [TriggerEvent.NEXT_ACTION]: new NextAction(),
};

export function buildTriggerStrategy(
  triggerEvent: TriggerEvent,
  targetCardId?: string,
): Trigger {
  if (triggerEvent === TriggerEvent.ALLY_DEATH) {
    if (!targetCardId) {
      throw new Error('Ally death trigger requires targetCardId');
    }
    return new AllyDeath(targetCardId);
  }
  return STRATEGY_MAP[triggerEvent];
}
