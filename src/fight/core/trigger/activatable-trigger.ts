import { FightingContext } from '../cards/@types/fighting-context';
import { Trigger } from './trigger';

export interface ActivatableTrigger extends Trigger {
  activate(triggerId: string, context: FightingContext): void;
}

export function isActivatableTrigger(trigger: Trigger): trigger is ActivatableTrigger {
  return typeof (trigger as ActivatableTrigger).activate === 'function';
}
