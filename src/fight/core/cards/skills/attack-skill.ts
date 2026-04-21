import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';
import { NamedAttackResult } from '../@types/action-result/named-attack-result';

export interface AttackSkill {
  name: string;
  targetingId: string;

  /**
   * Executes the attack using the skill's own internally-configured targeting strategy.
   * This is the default attack path, used when no targeting override is active on the card.
   *
   * @param card - The attacking card
   * @param context - The current fighting context (source and opponent players)
   * @param targetingStrategy - The override strategy to use instead of the skill's default strategy, if applicable
   * @returns The result of the attack, including damage dealt, whether it was a critical hit, and whether it was dodged
   */
  launch(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy?: TargetingCardStrategy,
  ): NamedAttackResult;
}
