import { AttackResult } from '../@types/action-result/attack-result';
import { FightingContext } from '../@types/fighting-context';
import { FightingCard } from '../fighting-card';
import { TargetingCardStrategy } from '../../targeting-card-strategies/targeting-card-strategy';

export interface AttackSkill {
  targetingId: string;

  /**
   * Executes the attack using the skill's own internally-configured targeting strategy.
   * This is the default attack path, used when no targeting override is active on the card.
   *
   * @param card - The attacking card
   * @param context - The current fighting context (source and opponent players)
   * @returns Array of attack results, one per targeted defender
   */
  launch(card: FightingCard, context: FightingContext): AttackResult[];

  /**
   * Executes the attack using an externally-supplied targeting strategy, bypassing
   * the skill's own default strategy. Called when a targeting override is active on
   * the card (e.g. from a `TARGETING_OVERRIDE` skill), allowing the card's attack
   * target selection to be changed dynamically mid-battle.
   *
   * @param card - The attacking card
   * @param context - The current fighting context (source and opponent players)
   * @param targetingStrategy - The override strategy to use instead of the skill's default
   * @returns Array of attack results, one per targeted defender
   */
  launchWithTargeting(
    card: FightingCard,
    context: FightingContext,
    targetingStrategy: TargetingCardStrategy,
  ): AttackResult[];
}
