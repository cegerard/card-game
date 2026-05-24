import { TargetedAll } from '../core/targeting-card-strategies/targeted-all';
import { TargetedFromPosition } from '../core/targeting-card-strategies/targeted-from-position';
import { TargetedLineThree } from '../core/targeting-card-strategies/targeted-line-three';
import { AllOwnerCards } from '../core/targeting-card-strategies/all-owner-cards';
import { AllAllies } from '../core/targeting-card-strategies/all-allies';
import { Launcher } from '../core/targeting-card-strategies/launcher';
import { AlliedCardByIdStrategy } from '../core/targeting-card-strategies/allied-card-by-id';
import { LastAttackerOfAllyTargetingStrategy } from '../core/targeting-card-strategies/last-attacker-of-ally';
import { TargetingStrategy } from './dto/fight-data.dto';
import { TargetingCardStrategy } from '../core/targeting-card-strategies/targeting-card-strategy';

const STATIC_STRATEGY_MAP: Record<string, TargetingCardStrategy> = {
  [TargetingStrategy.ALL_ALLIES]: new AllAllies(),
  [TargetingStrategy.ALL_OWNER_CARD]: new AllOwnerCards(),
  [TargetingStrategy.LINE_THREE]: new TargetedLineThree(),
  [TargetingStrategy.POSITION_BASED]: new TargetedFromPosition(),
  [TargetingStrategy.SELF]: new Launcher(),
  [TargetingStrategy.TARGET_ALL]: new TargetedAll(),
};

export function buildTargetingStrategy(
  strategyName: string,
  targetCardId?: string,
): TargetingCardStrategy {
  if (strategyName === TargetingStrategy.LINKED_ALLY) {
    if (!targetCardId)
      throw new Error(`${strategyName} strategy requires targetCardId`);
    return new AlliedCardByIdStrategy(targetCardId);
  }
  if (strategyName === TargetingStrategy.LAST_ATTACKER_OF_ALLY) {
    if (!targetCardId)
      throw new Error(`${strategyName} strategy requires targetCardId`);
    return new LastAttackerOfAllyTargetingStrategy(targetCardId);
  }
  const strategy = STATIC_STRATEGY_MAP[strategyName];
  if (!strategy) throw new Error(`Unknown targeting strategy: ${strategyName}`);
  return strategy;
}
