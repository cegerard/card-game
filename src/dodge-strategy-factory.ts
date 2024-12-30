import { SimpleDodge } from './core/cards/behaviors/simple-dodge';
export class DodgeStrategyFactory {
  static create(strategyName: string) {
    switch (strategyName) {
      case 'simple-dodge':
        return new SimpleDodge();
      default:
        throw new Error(`Unknown dodge strategy: ${strategyName}`);
    }
  }
}
