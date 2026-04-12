import { TurnEnd } from '../core/trigger/turn-end';
import { NextAction } from '../core/trigger/next-action';
import { AllyDeath } from '../core/trigger/ally-death';
import { EnemyDeath } from '../core/trigger/enemy-death';
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
  if (event === TriggerEvent.ALLY_DEATH) {
    return new AllyDeath(targetCardId);
  }
  return new EnemyDeath(targetCardId);
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

function buildReplacementTriggerFactory(
  replacementEvent: TriggerEvent,
): (cardId: string) => Trigger {
  if (
    replacementEvent === TriggerEvent.ALLY_DEATH ||
    replacementEvent === TriggerEvent.ENEMY_DEATH
  ) {
    return (cardId: string) => buildDeathTrigger(replacementEvent, cardId);
  }
  return () => buildSimpleTrigger(replacementEvent);
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
    const replacementFactory = buildReplacementTriggerFactory(
      dormantConfig.replacementEvent,
    );
    return new DynamicTrigger(activationTrigger, replacementFactory);
  }

  return buildSimpleTrigger(triggerEvent, targetCardId);
}
