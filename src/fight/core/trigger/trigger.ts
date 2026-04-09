import { FightingContext } from '../cards/@types/fighting-context';

export interface Trigger {
  id: string;

  isTriggered(triggerId: string, context?: FightingContext): boolean;
}
