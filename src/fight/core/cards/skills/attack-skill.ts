import { AttackResult } from '../@types/action-result/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';

export interface AttackSkill {
  launch(card: FightingCard, context: FightingContext): AttackResult[];
}
