import { FightingCard } from '../fighting-card';
import { Skill } from './skill';

export interface HealthReactiveSkill extends Skill {
  readonly isHealthReactive: true;

  /**
   * Called after each HP change on the card.
   * Returns true if the skill should trigger now (edge-triggered).
   */
  onHealthChanged(card: FightingCard): boolean;
}
