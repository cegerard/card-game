import { TargetedAll } from '../core/targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from '../core/targeting-card-strategies/targeted-from-position';
import { TargetedLineThree } from '../core/targeting-card-strategies/targeted-line-three';
import { AllOwnerCards } from '../core/targeting-card-strategies/all-owner-cards';
import { AllAllies } from '../core/targeting-card-strategies/all-allies';
import { Launcher } from '../core/targeting-card-strategies/launcher';
import { TargetingStrategy } from './dto/fight-data.dto';

const STRATEGY_MAP = {
  [TargetingStrategy.ALL_ALLIES]: new AllAllies(),
  [TargetingStrategy.ALL_OWNER_CARD]: new AllOwnerCards(),
  [TargetingStrategy.LINE_THREE]: new TargetedLineThree(),
  [TargetingStrategy.POSITION_BASED]: new TargetedFromPosition(),
  [TargetingStrategy.SELF]: new Launcher(),
  [TargetingStrategy.TARGET_ALL]: new TargetedAll(),
};

export function buildTargetingStrategy(strategyName: string) {
  return STRATEGY_MAP[strategyName];
}
