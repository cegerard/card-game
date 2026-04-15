import { TurnEnd } from '../core/trigger/turn-end';
import { NextAction } from '../core/trigger/next-action';
import { DeathTrigger } from '../core/trigger/death-trigger';
import { DynamicTrigger } from '../core/trigger/dynamic-trigger';
import { Trigger } from '../core/trigger/trigger';
import { TriggerEvent } from './dto/fight-data.dto';

const STRATEGY_MAP: Record<string, Trigger> = {
  [TriggerEvent.TURN_END]: new TurnEnd(),
  [TriggerEvent.NEXT_ACTION]: new NextAction(),
};

function buildDeathTrigger(
  event: TriggerEvent,
  targetCardId?: string,
): Trigger {
  if (!targetCardId) {
    throw new Error(`${event} trigger requires targetCardId`);
  }
  return new DeathTrigger(event as 'ally-death' | 'enemy-death', targetCardId);
}

function buildSimpleTrigger(
  event: TriggerEvent,
  targetCardId?: string,
): Trigger {
  if (event === TriggerEvent.ALLY_DEATH || event === TriggerEvent.ENEMY_DEATH) {
    return buildDeathTrigger(event, targetCardId);
  }
  const trigger = STRATEGY_MAP[event];
  if (!trigger) {
    throw new Error(`Unknown trigger event: ${event}`);
  }
  return trigger;
}

export function buildTriggerStrategy(
  triggerEvent: TriggerEvent,
  targetCardId?: string,
  dormantConfig?: {
    activationEvent: TriggerEvent;
    activationTargetCardId: string;
    replacementEvent: TriggerEvent;
  },
): Trigger {
  if (triggerEvent === TriggerEvent.DORMANT) {
    if (!dormantConfig) {
      throw new Error(
        'Dormant trigger requires activationEvent, activationTargetCardId, and replacementEvent',
      );
    }
    const activationTrigger = buildSimpleTrigger(
      dormantConfig.activationEvent,
      dormantConfig.activationTargetCardId,
    );
    return new DynamicTrigger(activationTrigger, (cardId) =>
      buildSimpleTrigger(dormantConfig.replacementEvent, cardId),
    );
  }

  return buildSimpleTrigger(triggerEvent, targetCardId);
}
