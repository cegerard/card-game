import { FightingCard } from '../cards/fighting-card';
import { TargetingCardStrategy } from './targeting-card-strategy';

/**
 * Placeholder for the cards the action of a special targeted: it targets
 * nobody by itself. A `ShieldApplication` holding it lands on the targets the
 * special hands over instead.
 */
export class SpecialTargets implements TargetingCardStrategy {
  public readonly id = 'special-targets';

  public targetedCards(): FightingCard[] {
    return [];
  }
}
