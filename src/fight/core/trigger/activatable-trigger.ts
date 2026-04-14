import { FightingContext } from '../cards/@types/fighting-context';
import { Trigger } from './trigger';

export interface ActivatableTrigger extends Trigger {
  activate(triggerId: string, context: FightingContext): void;
}
