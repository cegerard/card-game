import { TargetedAll } from './core/targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from './core/targeting-card-strategies/targeted-from-position';
import { TargetedLineThree } from './core/targeting-card-strategies/targeted-line-three';
import { AllOwnerCards } from './core/targeting-card-strategies/all-owner-cards';
import { AllAllies } from './core/targeting-card-strategies/all-allies';
import { Launcher } from './core/targeting-card-strategies/launcher';

export class TargetingStrategyFactory {
  static create(strategyName: string) {
    switch (strategyName) {
      case 'position-based':
        return new TargetedFromPosition();
      case 'target-all':
        return new TargetedAll();
      case 'line-three':
        return new TargetedLineThree();
      case 'all-owner-card':
        return new AllOwnerCards();
      case 'all-allies':
        return new AllAllies();
      case 'self':
        return new Launcher();
      default:
        throw new Error(`Unknown targeting strategy: ${strategyName}`);
    }
  }
}
