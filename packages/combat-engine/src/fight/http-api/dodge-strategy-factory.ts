import { DodgeStrategy } from '@card-game/shared-types';
import { RandomDodge } from '../core/cards/behaviors/random-dodge';
import { SimpleDodge } from '../core/cards/behaviors/simple-dodge';
import { Randomizer } from '../core/randomizer';

export function buildDodgeStrategy(
  dodgeStrategy: DodgeStrategy,
  randomizer: Randomizer,
) {
  const STRATEGY_MAP = {
    [DodgeStrategy.SIMPLE_DODGE]: new SimpleDodge(),
    [DodgeStrategy.RANDOM_DODGE]: new RandomDodge(randomizer),
  };
  return STRATEGY_MAP[dodgeStrategy];
}
