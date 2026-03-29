import { AttackResult } from '../@types/action-result/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export interface AttackSkill {
  targetingId: string;
  launch(card: FightingCard, context: FightingContext): AttackResult[];
  launchWithTargeting(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy: TargetingCardStrategy,
  ): AttackResult[];
}
