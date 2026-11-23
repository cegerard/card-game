import { FightingCard } from '../cards/fighting-card';
import { TargetingCardStrategy } from './targeting-card-strategy';

export class NoTargets implements TargetingCardStrategy {
  public readonly id = 'no-targets';

  public targetedCards(): FightingCard[] {
    return [];
  }
}
