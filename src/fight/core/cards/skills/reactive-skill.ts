import { FightingCard } from '../fighting-card';
import { Skill } from './skill';

export interface ReactiveSkill extends Skill {
  /**
   * Called after each HP change on the card.
   * Returns true if the skill should trigger now (edge-triggered).
   */
  onHealthChanged(card: FightingCard): boolean;
}
