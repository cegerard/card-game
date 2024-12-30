import { RandomDodge } from './core/cards/behaviors/random-dodge';
import { SimpleDodge } from './core/cards/behaviors/simple-dodge';

export class DodgeStrategyFactory {
  static create(strategyName: string) {
    switch (strategyName) {
      case 'simple-dodge':
        return new SimpleDodge();
      case 'random-dodge':
        return new RandomDodge();
      default:
        throw new Error(`Unknown dodge strategy: ${strategyName}`);
    }
  }
}
