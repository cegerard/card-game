import { TargetedAll } from './core/targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from './core/targeting-card-strategies/targeted-from-position';
import { TargetedLineThree } from './core/targeting-card-strategies/targeted-line-three';

export class TargetingStrategyFactory {
  static create(strategyName: string) {
    switch (strategyName) {
      case 'position-based':
        return new TargetedFromPosition();
      case 'target-all':
        return new TargetedAll();
      case 'line-three':
        return new TargetedLineThree();
      default:
        throw new Error(`Unknown targeting strategy: ${strategyName}`);
    }
  }
}
