import { TargetedAll } from './core/targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from './core/targeting-card-strategies/targeted-from-position';

export class TargetingStrategyFactory {
  static create(strategyName: string) {
    switch (strategyName) {
      case 'position-based':
        return new TargetedFromPosition();
      case 'target-all':
        return new TargetedAll();
      default:
        throw new Error(`Unknown targeting strategy: ${strategyName}`);
    }
  }
}
