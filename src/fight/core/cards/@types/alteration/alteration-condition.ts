import { FightingCard } from '../../fighting-card';
import { FightingContext } from '../fighting-context';

export interface AlterationCondition {
  id: string;
  evaluate(source: FightingCard, context: FightingContext): boolean;
}
