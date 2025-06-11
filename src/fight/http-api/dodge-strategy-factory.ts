import { RandomDodge } from '../core/cards/behaviors/random-dodge';
import { SimpleDodge } from '../core/cards/behaviors/simple-dodge';
import { MathRandomizer } from '../tools/math-randomizer';
import { DodgeStrategy } from './dto/fight-data.dto';

const STRATEGY_MAP = {
  [DodgeStrategy.SIMPLE_DODGE]: new SimpleDodge(),
  [DodgeStrategy.RANDOM_DODGE]: new RandomDodge(new MathRandomizer()),
};

export function buildDodgeStrategy(dodgeStrategy: DodgeStrategy) {
  return STRATEGY_MAP[dodgeStrategy];
}
